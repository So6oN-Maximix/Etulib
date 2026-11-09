const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

async function verifyCityName(name) {
	if (typeof name !== "string" || name.length < 2 || name.length > 100) return null;
	const url = new URL("https://geo.api.gouv.fr/communes");
	url.searchParams.set("nom", name);
	url.searchParams.set("fields", "nom,code,codesPostaux,centre");
	url.searchParams.set("limit", "5");
	const res = await fetch(url);
	if (!res.ok) throw new Error("API commune indisponible");

	const matches = (await res.json()).filter(c => normalize(c.nom) === normalize(name));
	return matches.length === 1 ? matches[0] : null;
}

const normalize = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

router.get("/tutor/:id", async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		if (!Number.isInteger(id)) return res.status(400).json({ error: "Identifiant invalide" });

		const tutor = await prisma.tutorProfile.findUnique({
			where: { id: id },
			select: {
				id: true,
				bio: true,
				user: { select: { firstName: true, lastName: true, createdAt: true } },
                dispos: { select: { id: true, day: true,  startMin: true, endMin: true } },
				subjects: { select: { id: true, title: true, subject: true, level: true, bio: true, hourlyRate: true, duration: true, mode: true }, orderBy: { createdAt: "asc" } },
				experiences: { select: { id: true, title: true, location: true, startYear: true, endYear: true }, orderBy: [{ endYear: { sort: "desc", nulls: "first" } }, { startYear: "desc" }] }
			}
		});
		if (!tutor) return res.status(404).json({ error: "Professeur introuvable" });

		res.json({ tutor });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.get("/search-tutor", async (req, res) => {
    try {
        const { course, location } = req.query;
        const filter = {};

        if (location) {
            const city = parseInt((await verifyCityName(location)).code);
            filter.city = { equals: city };
        }
        if (course) {
            filter.subjects = {
                some: {
                    subject: {
                        contains: course,
                        mode: "insensitive"
                    }
                }
            };
        }

        const tutors = await prisma.tutorProfile.findMany({
            where: filter,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                subjects: { where: course ? filter.subjects.some : undefined }
            }
        });
        res.status(200).json(tutors);
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

module.exports = router;