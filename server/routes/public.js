const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/tutor/:id", async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		if (!Number.isInteger(id)) return res.status(400).json({ error: "Identifiant invalide" });

		const tutor = await prisma.tutorProfile.findUnique({
			where: { userId: id },
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

module.exports = router;