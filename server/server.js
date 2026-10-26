require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 2000;

const root = path.join(__dirname, "..");
app.use(express.json());

const session = require("express-session");
const helmet = require("helmet");

app.use(helmet({
	contentSecurityPolicy: false,
	referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use("/styles.css", express.static(path.join(root, "styles.css")));
app.use("/JS", express.static(path.join(root, "JS")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/tutor", require("./routes/tutor"));
app.use("/api/public", require("./routes/public"));
app.use("/api/student", require("./routes/student"));
app.use("/api/parent", require("./routes/parent"));

app.get("/", (req, res) => res.sendFile(path.join(root, "index.html")));

const protectedPages = { student_profil: ["STUDENT", "PARENT"], parent_profil: ["PARENT"], tutor_profil: ["TUTOR"] };
app.get("/:page", (req, res) => {
	const allowed = protectedPages[req.params.page];
	if (allowed && !allowed.includes(req.session.user?.role)) return res.redirect("/");
	res.sendFile(`${req.params.page}.html`, { root: path.join(root, "HTML") }, err => {
		if (err) res.status(404).send("Page non trouvée");
	});
});

app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));