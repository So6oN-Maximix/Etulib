const express = require("express");
const prisma = require("../lib/prisma");
const { decryptMessage, encryptMessage } = require("../lib/crypto");

const router = express.Router();

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
                createdAt: true
            },
            orderBy: { createdAt: "asc" }
        });
        await prisma.message.updateMany({
            where: { conversationId: conversationId },
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

router.post("/send", async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        await prisma.message.create({
            data: { conversationId, senderId: req.session.user.id, body: encryptMessage(message, conversationId) }
        });
        res.status(201).json({ message: "Message envoyé" });
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

module.exports = router;