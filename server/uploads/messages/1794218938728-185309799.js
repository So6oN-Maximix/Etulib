const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async event => {
    event.preventDefault();
	const dataForm = Object.fromEntries(new FormData(loginForm));
    const errorPara = document.getElementById("form-msg");
    try {
        const loginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify(dataForm)
        });
        const loginResData = await loginRes.json();

        if (loginRes.ok) window.location.href = loginResData.user.role === "TUTOR" ? "/tutor_profil" : (loginResData.user.role === "STUDENT" ? "/student_profil" : "/parent_profil");
        else {
            errorPara.hidden = false;
            errorPara.textContent = loginResData.error;
        }
    } catch (error) {
        errorPara.hidden = false;
        errorPara.textContent = "Erreur Server";
    }
});

document.querySelectorAll(".pw-toggle").forEach(btn => btn.addEventListener("click", () => {
	const input = btn.parentElement.querySelector("input");
	const show = input.type === "password";
	input.type = show ? "text" : "password";
	btn.setAttribute("aria-pressed", show);
	btn.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
}));