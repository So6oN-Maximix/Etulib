const express = require("express");
const path = require("path");
const prisma = require("../lib/prisma");
const upload = require("../lib/upload");
const requireAuth = require("../middleware/requireAuth");
const requireChildren = require("../middleware/requireChildren");
const { encryptMessage } = require("../lib/crypto");

require("dotenv").config();
process.env.MESSAGE_KEY_V1

const router = express.Router();

function parseLesson(body) {
    const { tutorId, reservation, courseId } = body;
    const today = new Date(Date.now());
    const reserveDate = new Date(reservation);
    if (typeof tutorId !== "number" || typeof courseId !== "number" || reserveDate < today) return null;
    return { tutorId, reserveDate, courseId };
}

function formatTime(dateInput) {
    const date = new Date(dateInput);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}h${minutes}`;
}

async function getLessonAccess(user, lessonId) {
    if (!user || !Number.isInteger(lessonId)) return null;
    return prisma.lesson.findFirst({
        where: {
            id: lessonId,
            OR: [
                { tutor: { userId: user.id } },
                { student: { userId: user.id } },
                { student: { parent: { userId: user.id } } }
            ]
        },
        select: { id: true }
    });
}

const uploadLessonFile = (req, res, next) => {
    upload.lessons.single("file")(req, res, error => {
        if (!error) return next();
        const messages = {
            LIMIT_FILE_SIZE: "Fichier trop lourd (10 Mo maximum)",
            INVALID_TYPE: "Format non accepté (PDF, images ou documents Word)"
        };
        res.status(400).json({ error: messages[error.code] || "Fichier invalide" });
    });
};

router.post("/reserve", requireAuth(["STUDENT", "PARENT"]), async (req, res) => {
    try {
        const data = parseLesson(req.body);
        if (!data) return res.status(400).json({ error: "Champs invalides" });
        const getStudentId = await prisma.studentProfile.findUnique({
            where: { userId: req.session.user.id }
        });
        const saveLesson = await prisma.lesson.create({
            data: { studentId: getStudentId.id, tutorId: data.tutorId, courseId: data.courseId, startDate: new Date(data.reserveDate)},
            select: {
                startDate: true,
                course: {
                    select: {
                        subject: true,
                        duration: true,
                        mode: true
                    }
                },
                tutor: {
                    select: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });
        
        const courseInfo = await prisma.course.findUnique({
            where: { id: data.courseId },
            select: {
                subject: true,
                duration: true
            }
        });
        const startDate = new Date(data.reserveDate);
        const formatedStartDate = startDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        const systemMessageText = `Cours de <b>${courseInfo.subject}</b> réservé pour le <b>${formatedStartDate.charAt(0).toUpperCase() + formatedStartDate.slice(1)} à ${formatTime(startDate)}</b>`;
        
        const getTutorUserId = await prisma.tutorProfile.findUnique({
            where: { id: data.tutorId },
            select: { userId: true }
        });
        let findConversationId = await prisma.conversation.findUnique({
            where: {
                tutorId_studentId: {
                    tutorId: getTutorUserId.userId,
                    studentId: req.session.user.id
                }
            },
            select: { id: true }
        });
        if (!findConversationId) findConversationId = await prisma.conversation.create({
            data: {
                tutorId: getTutorUserId.userId,
                studentId: req.session.user.id
            },
            select: { id: true }
        });

        await prisma.message.create({
            data: {
                conversationId: findConversationId.id,
                senderId: 0,
                body: encryptMessage(systemMessageText, findConversationId.id)
            }
        });
        res.status(201).json({ saveLesson });
    } catch (error) {
        if (error.code === "P2002") return res.status(409).json({ error: "Ce créneau a déjà été réservé" });
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.get("/get-next", requireChildren, async (req, res) => {
    try {
        const nextLessons = await prisma.lesson.findMany({
            where: {
                student: { userId: req.studentUserId },
                startDate: { gte: new Date(Date.now()) }
            },
            orderBy: { startDate: "asc" },
            select: {
                id: true,
                startDate: true,
                course: {
                    select: {
                        title: true,
                        subject: true,
                        duration: true,
                        mode: true
                    }
                },
                tutor: {
                    select: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json({ nextLessons });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.post("/get-info", async (req, res) => {
    try {
        let { id } = req.body;
        if (typeof id !== "number") id = parseInt(id);
        if (!await getLessonAccess(req.session.user, id)) return res.status(403).json({ error: "Accès refusé" });
        const lessonInfo = await prisma.lesson.findUnique({
            where: { id: id },
            select: {
                id: true,
                startDate: true,
                course: {
                    select: {
                        title: true,
                        subject: true,
                        level: true,
                        bio: true,
                        hourlyRate: true,
                        duration: true,
                        mode: true
                    }
                },
                tutor: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                student: {
                    select: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });
        lessonInfo.connectedRole = req.session.user.role;
        res.status(200).json({ lessonInfo });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.get("/get-files", async (req, res) => {
    try {
        const lessonId = parseInt(req.query.id);
        if (!await getLessonAccess(req.session.user, lessonId)) return res.status(403).json({ error: "Accès refusé" });

        const attachments = await prisma.attachment.findMany({
            where: { lessonId },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                originalName: true,
                mimeType: true,
                size: true,
                createdAt: true,
                userId: true,
                user: { select: { firstName: true } }
            }
        });
        const files = attachments.map(({ userId, ...file }) => ({ ...file, mine: userId === req.session.user.id }));
        res.status(200).json({ files });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.post("/save-file", uploadLessonFile, async (req, res) => {
    try {
        const file = req.file;
        const attachment = await prisma.attachment.create({
            data: {
                originalName: Buffer.from(file.originalname, "latin1").toString("utf8"),
                filename: file.filename,
                mimeType: file.mimetype,
                size: file.size,
                userId: req.session.user.id,
                lessonId: parseInt(req.query.id)
            },
            select: {
                id: true,
                originalName: true,
                mimeType: true,
                size: true,
                createdAt: true,
                userId: true,
                user: { select: { firstName: true } }
            }
        });
        attachment.mine = true;
        res.status(201).json(attachment);
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

module.exports = router;