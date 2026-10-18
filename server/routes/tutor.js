const express = require("express");
const prisma = require("../lib/prisma");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const LEVELS = ["PRIMAIRE", "COLLEGE", "LYCEE", "SUP"];
const MODES = ["DOMICILE", "EN_LIGNE", "TOUS"];
const COURSE_SELECT = { id: true, title: true, subject: true, level: true, bio: true, hourlyRate: true, duration: true, mode: true };
const EXP_SELECT = { id: true, title: true, location: true, startYear: true, endYear: true };

function parseCourse(body) {
	const { title, subject, level, bio, mode } = body;
	const hourlyRate = parseInt(body.hourlyRate);
	const duration = parseInt(body.duration);
	const texts = [title, subject, bio];
	if (!texts.every(t => typeof t === "string" && t.trim()) || !(hourlyRate >= 0) || !LEVELS.includes(level) || !MODES.includes(mode) || !(duration > 0)) return null;
	return { title: title.trim(), subject: subject.trim(), level, bio: bio.trim(), hourlyRate, duration, mode };
}

function parseExperience(body) {
	const { title, location } = body;
	const startYear = parseInt(body.startYear);
	const endYear = body.endYear ? parseInt(body.endYear) : null;
	const texts = [title, location];
	if (!texts.every(t => typeof t === "string" && t.trim()) || !(startYear >= 0) || (endYear && !(endYear >= startYear))) return null;
	return { title: title.trim(), location: location.trim(), startYear, endYear };
}


router.get("/courses", requireAuth(["TUTOR"]), async (req, res) => {
    try {
        const tutorProfile = await prisma.tutorProfile.findUnique({
            where: { userId: req.session.user.id},
			select: {
                subjects: {
                    select: COURSE_SELECT,
                    orderBy: { createdAt: "asc" }
                }
            }
        });
        res.json({ courses: tutorProfile ? tutorProfile.subjects : [] });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.get("/experiences", requireAuth(["TUTOR"]), async (req, res) => {
    try {
        const tutorProfile = await prisma.tutorProfile.findUnique({
            where: { userId: req.session.user.id},
			select: {
                experiences: {
                    select: EXP_SELECT,
                    orderBy: [{ endYear: { sort: "desc", nulls: "first" } }, { startYear: "desc" }]
                }
            }
        });
        res.json({ experiences: tutorProfile ? tutorProfile.experiences : [] });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.post("/add-course", requireAuth(["TUTOR"]), async (req, res) => {
    try {
        const data = parseCourse(req.body);
        if (!data) return res.status(400).json({ error: "Champs invalides" });

        const getTutorProfilId = await prisma.tutorProfile.findUnique({
            where: { userId: req.session.user.id },
            select: { id: true}
        });
        const addCourseToDB = await prisma.course.create({
            data: {
                tutorId: getTutorProfilId.id,
                title: data.title,
                subject: data.subject,
                level: data.level,
                bio: data.bio,
                hourlyRate: parseInt(data.hourlyRate),
                duration: parseInt(data.duration),
                mode: data.mode },
            select: COURSE_SELECT
        });
        res.status(201).json({ addCourseToDB });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.delete("/delete-course/:id", requireAuth(["TUTOR"]), async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		if (!Number.isInteger(id)) return res.status(400).json({ error: "Identifiant invalide" });

		const { count } = await prisma.course.deleteMany({
			where: { id, tutor: { userId: req.session.user.id } }
		});
		if (count === 0) return res.status(404).json({ error: "Cours introuvable" });
		res.status(204).end();
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.patch("/update-course/:id", requireAuth(["TUTOR"]), async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const data = parseCourse(req.body);
		if (!Number.isInteger(id) || !data) return res.status(400).json({ error: "Champs invalides" });

		const { count } = await prisma.course.updateMany({ where: { id, tutor: { userId: req.session.user.id } }, data });
		if (count === 0) return res.status(404).json({ error: "Cours introuvable" });

		const course = await prisma.course.findUnique({ where: { id }, select: COURSE_SELECT });
		res.json({ course });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.post("/add-experience", requireAuth(["TUTOR"]), async (req, res) => {
    try {
        const data = parseExperience(req.body);
        if (!data) return res.status(400).json({ error: "Champs invalides" });

        const getTutorProfilId = await prisma.tutorProfile.findUnique({
            where: { userId: req.session.user.id },
            select: { id: true}
        });
        const addExpToDB = await prisma.experience.create({
            data: {
                tutorId: getTutorProfilId.id,
                title: data.title,
                location: data.location,
                startYear: parseInt(data.startYear),
                endYear: parseInt(data.endYear),
            },
            select: EXP_SELECT
        });
        res.status(201).json({ addExpToDB });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.delete("/delete-experience/:id", requireAuth(["TUTOR"]), async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		if (!Number.isInteger(id)) return res.status(400).json({ error: "Identifiant invalide" });

		const { count } = await prisma.experience.deleteMany({
			where: { id, tutor: { userId: req.session.user.id } }
		});
		if (count === 0) return res.status(404).json({ error: "Cours introuvable" });
		res.status(204).end();
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.patch("/update-experience/:id", requireAuth(["TUTOR"]), async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const data = parseExperience(req.body);
		if (!Number.isInteger(id) || !data) return res.status(400).json({ error: "Champs invalides" });

		const { count } = await prisma.experience.updateMany({ where: { id, tutor: { userId: req.session.user.id } }, data });
		if (count === 0) return res.status(404).json({ error: "Expérience introuvable" });

		const experience = await prisma.experience.findUnique({ where: { id }, select: EXP_SELECT });
		res.json({ experience });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

module.exports = router;