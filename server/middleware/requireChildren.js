const prisma = require("../lib/prisma");

module.exports = async (req, res, next) => {
	try {
		const user = req.session.user;
		if (!user) return res.status(401).json({ error: "Accès refusé" });

		if (user.role === "STUDENT") { req.studentUserId = user.id; return next(); }

		if (user.role === "PARENT") {
			const id = typeof req.query.id === "string" ? parseInt(req.query.id, 10) : NaN;
			if (!Number.isInteger(id)) return res.status(400).json({ error: "Identifiant invalide" });

			const student = await prisma.studentProfile.findFirst({
				where: { userId: id, parent: { userId: user.id } }
			});
			if (!student) return res.status(403).json({ error: "Accès refusé" });
			req.studentUserId = id;
			return next();
		}

		res.status(403).json({ error: "Accès refusé" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
};