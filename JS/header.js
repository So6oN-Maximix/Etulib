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

			box.replaceChildren(space, logout);
		}
	} catch (error) {}
	box.classList.add("ready");
})();