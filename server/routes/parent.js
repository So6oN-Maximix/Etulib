const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const LEVELS = ["PRIMAIRE", "COLLEGE", "LYCEE", "SUP"];
const CHILDREN_SELECT = {
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true
        }
    },
    level: true
};

function parseParent(body) {
    const { firstName, lastName, email, phone, city } = body;
    const phoneValidation = /^(?:0|\+33)[1-9](?:[ .-]?\d{2}){4}$/;
    const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!phoneValidation.test(phone) || !emailValidation.test(email) || !firstName || !lastName) return null;
    return { firstName, lastName, email, phone: normalizePhone(phone), city }
}

function parseChild(body) {
    const { firstName, level, email, birthDate } = body;
    const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if ((email && !emailValidation.test(email)) || !firstName || !LEVELS.includes(level) || !birthDate) return null;
    return { firstName, level, email, birthDate }
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

router.get("/get-info", requireAuth(["PARENT"]), async (req, res) => {
    try {
        const parentInfo = await prisma.parentProfile.findUnique({
            where: { userId: req.session.user.id },
            select: {
                phone: true,
                city: true
            }
        });
        parentInfo.phone = parentInfo.phone ? formatPhone(parentInfo.phone) : "";
        res.status(200).json(parentInfo);
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.patch("/perso-info", requireAuth(["PARENT"]), async (req, res) => {
    try {
        const data = parseParent(req.body);
        if (!data) return res.status(400).json({ error: "Champs invalides" });
        const { countUser } = await prisma.user.updateMany({
            where: { id: req.session.user.id },
            data: { email: data.email, firstName: data.firstName, lastName: data.lastName}
        });
        if (countUser === 0) return res.status(404).json({ error: "Profil utilisateur introuvable" });
        const { countParent } = await prisma.parentProfile.updateMany({
            where: { userId: req.session.user.id },
            data: { phone: data.phone, city: data.city }
        });
        if (countParent === 0) return res.status(404).json({ error: "Profil élève introuvable" });
        res.status(200).json({ message: "Informations enregistrée" });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.post("/add-child", requireAuth(["PARENT"]), async (req, res) => {
    try {
        const data = parseChild(req.body);
        if (!data) return res.status(400).json({ error: "Champs invalides" });

        const getParentId = await prisma.parentProfile.findUnique({
            where: { userId: req.session.user.id }
        });
        const addChild = await prisma.user.create({
            data: {
                email: data.email ? data.email : null,
                firstName: data.firstName,
                lastName: req.session.user.lastName,
                role: "STUDENT",
                student: {
                    create: {
                        parentId: getParentId.id,
                        birthDate: new Date(data.birthDate),
                        level: data.level
                    }
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                student: { select: { level: true } }
            }
        });
        const children = {
            user: {
                id: addChild.id,
                firstName: addChild.firstName,
                lastName: addChild.lastName
            },
            level: addChild.student.level
        }
        res.status(201).json({ message: "Enfant créé avec succès", children });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.get("/get-children", requireAuth(["PARENT"]), async (req, res) => {
    try {
        const getParentId = await prisma.parentProfile.findUnique({
            where: { userId: req.session.user.id }
        }); 
        const children = await prisma.studentProfile.findMany({
            where: { parentId: getParentId.id },
            select: CHILDREN_SELECT
        });
        res.status(200).json({ children });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

module.exports = router;