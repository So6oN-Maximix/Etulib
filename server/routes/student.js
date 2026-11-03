const express = require("express");
const prisma = require("../lib/prisma");
const requireChildren = require("../middleware/requireChildren");

const router = express.Router();

const LEVELS = ["PRIMAIRE", "COLLEGE", "LYCEE", "SUP"];

function parseStudent(body) {
    const { firstName, lastName, email, phone, city } = body
    const phoneValidation = /^(?:0|\+33)[1-9](?:[ .-]?\d{2}){4}$/;
    const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!phoneValidation.test(phone) || !emailValidation.test(email) || !firstName || !lastName) return null;
    const level = body.level === "NULL" ? null : (LEVELS.includes(body.level) ? body.level : null);
    return { firstName, lastName, email, phone: normalizePhone(phone), city, level }
}

function normalizePhone(input) {
	const digits = String(input).replace(/[\s.\-()]/g, "").replace(/^(\+33|0033|0)/, "");
	return /^[1-9]\d{8}$/.test(digits) ? "+33" + digits : null;
}

function formatPhone(normalizedPhone) {
    const cleanedPhone = normalizedPhone.replace("+33", "");
    const phoneParts = cleanedPhone.match(/^.|.{2}/g);
    return `0${phoneParts.join(" ")}`;
}

router.get("/get-info", requireChildren, async (req, res) => {
    try {
		const studentInfo = await prisma.studentProfile.findUnique({
			where: { userId: req.studentUserId },
			select: {
				phone: true, city: true, level: true, birthDate: true,
				user: { select: { firstName: true, lastName: true, email: true, createdAt: true } }
			}
		});
		if (!studentInfo) return res.status(404).json({ error: "Élève introuvable" });
        const { user, ...rest } = studentInfo;
        res.json({ ...rest, ...user, phone: rest.phone ? formatPhone(rest.phone) : "", email: user.email ? user.email : req.session.user.email });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.patch("/perso-info", requireChildren, async (req, res) => {
    try {
        const data = parseStudent(req.body);
        if (!data) return res.status(400).json({ error: "Champs invalides" });
        const { countUser } = await prisma.user.updateMany({
            where: { id: req.studentUserId },
            data: { email: data.email, firstName: data.firstName, lastName: data.lastName}
        });
        if (countUser === 0) return res.status(404).json({ error: "Profil utilisateur introuvable" });
        const { countStudent } = await prisma.studentProfile.updateMany({
            where: { userId: req.studentUserId },
            data: { phone: data.phone, city: data.city, level: data.level }
        });
        if (countStudent === 0) return res.status(404).json({ error: "Profil élève introuvable" });
        res.status(200).json({ message: "Informations enregistrée" });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.get("/get-tutors", requireChildren, async (req, res) => {
    try {
        const getPastTutors = await prisma.tutorProfile.findMany({
            where: {
                lessons: {
                    some: {
                        student: { userId: req.studentUserId }
                    }
                }
            },
            select: {
                id: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                subjects: {
                    where: {
                        lesson: {
                            some: {
                                student: { userId: req.studentUserId }
                            }
                        }
                    },
                    select: { subject: true },
                    distinct: ["subject"]
                },
                _count: {
                    select: {
                        lessons: {
                            where: {
                                student: { userId: req.studentUserId }
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json({ getPastTutors });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

module.exports = router;