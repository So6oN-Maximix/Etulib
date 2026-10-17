module.exports = (roles) => (req, res, next) => {
	const user = req.session.user;
	if (!user || (roles && !roles.includes(user.role))) return res.status(401).json({ error: "Accès refusé" });
	next();
};