const express = require("express");
const fs = require("fs");
const path = require("path");
const prisma = require("../lib/prisma");
const upload = require("../lib/upload");
const { decryptMessage, encryptMessage } = require("../lib/crypto");

const router = express.Router();

const uploadFiles = (req, res, next) => {
    upload.array("files", 5)(req, res, error => {
        if (!error) return next();
        const msg = error.code === "LIMIT_FILE_SIZE" ? "Fichier trop lourd (10 Mo maximum)" : "Fichiers invalides";
        res.status(400).json({ error: msg });
    });
};

router.get("/get-conversation", async (req, res) => {
    try {
        let whereCondition;
        let selectIds;
        if (req.session.user.role === "TUTOR") {
            whereCondition = { tutorId: req.session.user.id }
            selectIds = { studentId: true };
        } else {
            whereCondition = { studentId: req.session.user.id }
            selectIds = { tutorId: true };
        }
        selectIds.id = true;
        const getConversations = await prisma.conversation.findMany({
            where: whereCondition,
            select: selectIds
        });
        const conversations = getConversations.map(conv => ({
            id: conv.id,
            userId: req.session.user.role === "TUTOR" ? conv.studentId : conv.tutorId
        }));
        res.status(200).json({ conversations });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.get("/get-conv-infos", async (req, res) => {
    try {
        const id = parseInt(req.query.id);
        const conversationInfos = await prisma.user.findUnique({
            where: { id: id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                tutor: {
                    select: { id: true }
                }
            }
        });
        res.status(200).json({ conversationInfos });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.get("/get-new-msg", async (req, res) => {
    try {
        const conversationId = parseInt(req.query.id);
        const newMsgCount = await prisma.message.count({
            where: {
                conversationId: conversationId,
                senderId: { not: req.session.user.id },
                isRead: false
            }
        });
        const lastMsg = await prisma.message.findFirst({
            where: { conversationId: conversationId },
            orderBy: { createdAt: "desc" },
            select: {
                body: true,
                senderId: true,
                createdAt: true
            }
        });
        const prefix = lastMsg.senderId === req.session.user.id ? "Vous: " : "";
        res.status(200).json({
            count: newMsgCount,
            ...lastMsg,
            body: `${prefix}${decryptMessage(lastMsg.body, conversationId)}`
        });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.post("/get-msg", async (req, res) => {
    try {
        const conversationId = parseInt(req.body.conversationId);
        const getMessages = await prisma.message.findMany({
            where: { conversationId: conversationId },
            select: {
                senderId: true,
                body: true,
                isRead: true,
                attachments: {
                    select: {
                        id: true,
                        originalName: true,
                        mimeType: true,
                        size: true
                    }
                },
                createdAt: true
            },
            orderBy: { createdAt: "asc" }
        });
        await prisma.message.updateMany({
            where: { conversationId: conversationId, senderId: { not: req.session.user.id } },
            data: { isRead: true }
        });
        const messages = getMessages.map(msg => ({
            ...msg,
            body: decryptMessage(msg.body, conversationId),
            myId: req.session.user.id
        }));
        res.status(200).json({ messages });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.post("/send", uploadFiles, async (req, res) => {
    const files = req.files || [];
    const removeFiles = () => files.forEach(f => fs.unlink(f.path, () => {}));
    try {
        const userId = req.session.user.id;
        const conversationId = parseInt(req.body.conversationId);
        const message = (req.body.message || "").trim();
        if (!message && files.length === 0) {
            removeFiles();
            return res.status(400).json({ error: "Message vide" });
        }

        const sent = await prisma.$transaction(async tx => {
            const created = await tx.message.create({
                data: {
                    conversationId,
                    senderId: userId,
                    body: encryptMessage(message, conversationId)
                }
            });
            if (files.length > 0) {
                await tx.attachment.createMany({
                    data: files.map(file => ({
                        originalName: Buffer.from(file.originalname, "latin1").toString("utf8"),
                        filename: file.filename,
                        mimeType: file.mimetype,
                        size: file.size,
                        userId,
                        messageId: created.id
                    }))
                });
            }
            return tx.message.findUnique({
                where: { id: created.id },
                select: {
                    id: true,
                    senderId: true,
                    isRead: true,
                    createdAt: true,
                    attachments: {
                        select: { id: true, originalName: true, mimeType: true, size: true }
                    }
                }
            });
        });
        res.status(201).json({ ...sent, body: message, myId: userId });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.get("/get-unread", async (req, res) => {
    try {
        const conversationFilter = req.session.user.role === "TUTOR" ? { tutorId: req.session.user.id } : { studentId: req.session.user.id }
        const unreadMsgCount = await prisma.message.count({
            where: {
                conversation: conversationFilter,
                isRead: false,
                senderId: { not: req.session.user.id }
            }
        });
        res.status(200).json(unreadMsgCount);
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.get("/attachment/:id", async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: "Non connecté" });
        const userId = req.session.user.id;
        const id = parseInt(req.params.id);

        const attachment = await prisma.attachment.findUnique({
            where: { id },
            include: {
                message: {
                    select: {
                        conversation: { select: { tutorId: true, studentId: true } }
                    }
                }
            }
        });

        if (!attachment || !attachment.message) return res.status(404).json({ error: "Fichier introuvable" });

        const { tutorId, studentId } = attachment.message.conversation;
        if (userId !== tutorId && userId !== studentId) return res.status(403).json({ error: "Accès refusé" });

        const filePath = path.join(__dirname, "../uploads/messages", path.basename(attachment.filename));
        res.download(filePath, attachment.originalName, error => {
            if (error && !res.headersSent) res.status(404).json({ error: "Fichier introuvable sur le serveur" });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;