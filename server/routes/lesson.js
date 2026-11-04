const express = require("express");
const prisma = require("../lib/prisma");
const requireAuth = require("../middleware/requireAuth");
const requireChildren = require("../middleware/requireChildren");

const router = express.Router();

function parseLesson(body) {
    const { tutorId, reservation, courseId } = body;
    const today = new Date(Date.now());
    const reserveDate = new Date(reservation);
    if (typeof tutorId !== "number" || typeof courseId !== "number" || reserveDate < today) return null;
    return { tutorId, reserveDate, courseId };
}

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

module.exports = router;