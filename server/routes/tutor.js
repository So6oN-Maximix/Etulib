const express = require("express");
const prisma = require("../lib/prisma");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const LEVELS = ["PRIMAIRE", "COLLEGE", "LYCEE", "SUP"];
const MODES = ["DOMICILE", "EN_LIGNE", "TOUS"];
const COURSE_SELECT = { id: true, title: true, subject: true, level: true, bio: true, hourlyRate: true, duration: true, mode: true };
const EXP_SELECT = { id: true, title: true, location: true, startYear: true, endYear: true };
const AVAIL_SELECT = { id: true, day: true, startMin: true, endMin: true };

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
	if (!texts.every(t => typeof t === "string" && t.trim()) || !(startYear >= 0) || (endYear !== null && !(endYear >= startYear))) return null;
	return { title: title.trim(), location: location.trim(), startYear, endYear };
}

function parseAvailibility(list) {
	if (!Array.isArray(list)) return null;
	const out = [];
	for (const d of list) {
		if (!d || typeof d.start !== "string" || typeof d.end !== "string") return null;
		const day = parseInt(d.day);
		const startMin = formatMinutes(d.start);
		const endMin = formatMinutes(d.end);
		if (!(day >= 0 && day <= 6) || !(startMin >= 0 && endMin <= 1440 && startMin < endMin) || startMin % 30 || endMin % 30) return null;
		out.push({ day, startMin, endMin });
	}
	return out;
}

function formatMinutes(hour) {
    const hourSplit = hour.split(":");
    return parseInt(hourSplit[0]) * 60 + parseInt(hourSplit[1]);
}

function formatHours(minutes) { return `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`; }

async function updateFromDb(req, res, table, parseFunction, SELECT) {
    try {
        const id = parseInt(req.params.id);
        const data = parseFunction(req.body);
        if (!Number.isInteger(id) || !data) return res.status(400).json({ error: "Champs invalides" });

        const { count } = await prisma[table].updateMany({ where: { id, tutor: { userId: req.session.user.id } }, data });
        if (count === 0) return res.status(404).json({ error: "Element introuvable" });

        const findElem = await prisma[table].findUnique({ where: { id }, select: SELECT });
        res.json({ findElem });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
}

async function deleteFromDb(req, res, table) {
    try {
		const id = parseInt(req.params.id);
		if (!Number.isInteger(id)) return res.status(400).json({ error: "Identifiant invalide" });

		const { count } = await prisma[table].deleteMany({
			where: { id, tutor: { userId: req.session.user.id } }
		});
		if (count === 0) return res.status(404).json({ error: "Element introuvable" });
		res.status(204).end();
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
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
                startYear: data.startYear,
                endYear: data.endYear
            },
            select: EXP_SELECT
        });
        res.status(201).json({ addExpToDB });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.delete("/delete-course/:id", requireAuth(["TUTOR"]), async (req, res) => await deleteFromDb(req, res, "course"));
router.delete("/delete-experience/:id", requireAuth(["TUTOR"]), async (req, res) => await deleteFromDb(req, res, "experience"));

router.patch("/update-course/:id", requireAuth(["TUTOR"]), async (req, res) => await updateFromDb(req, res, "course", parseCourse, COURSE_SELECT));
router.patch("/update-experience/:id", requireAuth(["TUTOR"]), async (req, res) => await updateFromDb(req, res, "experience", parseExperience, EXP_SELECT));

router.get("/get-bio", requireAuth(["TUTOR"]), async (req, res) => {
    try {
        const getTutorBio = await prisma.tutorProfile.findUnique({
            where: { userId: req.session.user.id },
            select: { bio: true }
        });
        if (!getTutorBio) return res.status(404).json({ error: "Profil tuteur introuvable" });
        res.status(200).json({ bio: getTutorBio.bio });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.post("/save-bio", requireAuth(["TUTOR"]), async (req, res) => {
    try {
        const { bio } = req.body;

        const { count } = await prisma.tutorProfile.updateMany({
            where: { userId: req.session.user.id },
            data: { bio }
        });
        if (count === 0) return res.status(404).json({ error: "Profil tuteur introuvable" });
        res.status(200).json({ message: "Bio enregistrée" });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.post("/save-availibility", requireAuth(["TUTOR"]), async (req, res) => {
    try {
        const data = parseAvailibility(req.body.planner);
        if (!data) return res.status(400).json({ error: "Saisie invalide" });
        
		await prisma.availibility.deleteMany({
            where: { tutor: { userId: req.session.user.id } }
        });

        const getTutorProfilId = await prisma.tutorProfile.findUnique({
            where: { userId: req.session.user.id },
            select: { id: true}
        });

        let addedDispos = [];
        for (const dispo of data) {
            const addDispo = await prisma.availibility.create({
                data: {
                    tutorId: getTutorProfilId.id,
                    day: dispo.day,
                    startMin: dispo.startMin,
                    endMin: dispo.endMin
                },
                select: AVAIL_SELECT
            });
            addedDispos.push(addDispo);
        }
        const formatedDispos = addedDispos.map(dispo => {
            return {
                day: dispo.day,
                start: formatHours(dispo.startMin),
                end: formatHours(dispo.endMin)
            };
        });
        res.status(201).json({ formatedDispos });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.get("/get-availibility", requireAuth(["TUTOR"]), async (req, res) => {
    try {
        const allAvailibilities = await prisma.availibility.findMany({
            where: { tutor: { userId: req.session.user.id } },
            select: AVAIL_SELECT
        });
        const availibilities = allAvailibilities.map(availibility => {
            return {
                day: availibility.day,
                start: formatHours(availibility.startMin),
                end: formatHours(availibility.endMin)
            };
        });
        res.status(200).json({ availibilities });
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

module.exports = router;