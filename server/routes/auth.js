const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const prisma = require("../lib/prisma");

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, message: { error: "Trop de tentatives, réessayez plus tard." } });

const ROLES = ["PARENT", "STUDENT", "TUTOR"];
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 12);
const isStr = v => typeof(v) === "string";
const publicUser = u => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, role: u.role, createdAt: u.createdAt });


function startSession(req, res, user, status = 200) {
    req.session.regenerate(error => {
		if (error) return res.status(500).json({ error: "Erreur serveur" });
		req.session.user = publicUser(user);
		res.status(status).json({ user: req.session.user });
	});
}

router.post("/signup", limiter, async (req,res) => {
    try {
		const { email, password, role } = req.body;
		const firstName = req.body["first-name"], lastName = req.body["last-name"];
        if (![email, password, role, firstName, lastName].every(isStr)) return res.status(400).json({ error: "Champs invalides" });

		const cleanEmail = email.trim().toLowerCase();
		const cleanRole = role.toUpperCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ error: "Adresse e-mail invalide" });
		if (password.length < 8 || password.length > 72) return res.status(400).json({ error: "Le mot de passe doit faire entre 8 et 72 caractères" });
		if (!ROLES.includes(cleanRole)) return res.status(400).json({ error: "Rôle invalide" });
        
        const user = await prisma.user.create({
            data: {
				email: cleanEmail,
				passwordHash: await bcrypt.hash(password, 12),
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				role: cleanRole,
                ...(cleanRole === "TUTOR" && { tutor: { create: {} } })
            }
        });
		startSession(req, res, user, 201);
	} catch (error) {
		if (error.code === "P2002") return res.status(409).json({ error: "Cette adresse e-mail est déjà utilisée." });
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.post("/login", limiter, async (req, res) => {
    try {
        const { email, password } = req.body;
		if (!isStr(email) || !isStr(password)) return res.status(400).json({ error: "Champs invalides" });

		const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
		const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
        if (!user || !ok) return res.status(401).json({ error: "Utilisateur ou mot de passe incorrect"});
		startSession(req, res, user);
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

router.get("/me", (req, res) => {
	if (!req.session.user) return res.status(401).json({ error: "Non connecté" });
	res.json({ user: req.session.user });
});

router.post("/logout", (req, res) => {
	req.session.destroy(() => { res.clearCookie("connect.sid"); res.json({ ok: true }); });
});

module.exports = router;