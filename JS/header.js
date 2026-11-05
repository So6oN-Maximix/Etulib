function formatHours(minutes) { return `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`; }
function formatDuration(minutes) {
	if (minutes < 60) return `${minutes} min`;
	const h = Math.floor(minutes / 60), m = minutes % 60;
	return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function formatTime(dateInput) {
    const date = new Date(dateInput);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}h${minutes}`;
}

const formatedMode = {
    "TOUS": "en ligne ou à domicile",
    "EN_LIGNE": "en ligne",
    "DOMICILE": "à domicile"
};
const formatedLevel = {
    "PRIMAIRE": "en primaire",
    "COLLEGE": "au college",
    "LYCEE": "au lycée",
    "SUP": "en prépa et supérieur"
};

(async () => {
	const box = document.querySelector(".auth-buttons");
	if (!box) return;
	try {
		const res = await fetch("/api/auth/me");
		if (res.ok) {
			const { user } = await res.json();

			const space = document.createElement("a");
			space.href = user.role === "TUTOR" ? "/tutor_profil" : (user.role === "STUDENT" ? "/student_profil" : "/parent_profil");
			space.className = "btn-signup";
			space.textContent = "Mon espace";

			const logout = document.createElement("a");
			logout.href = "/";
			logout.className = "btn-logout";
			logout.textContent = "Se déconnecter";
			logout.addEventListener("click", async e => {
				e.preventDefault();
				await fetch("/api/auth/logout", { method: "POST" });
				window.location.href = "/";
			});

			const messages = document.createElement("a");
			messages.href = "/messages";
			messages.className = "nav-messages";
			messages.textContent = "Messages";

			box.replaceChildren(messages, space, logout);
		}
	} catch (error) {}
	box.classList.add("ready");
})();