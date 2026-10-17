const signupForm = document.getElementById("signup-form");

signupForm.addEventListener("submit", async event => {
    event.preventDefault();
	const dataForm = Object.fromEntries(new FormData(signupForm));
    const roleSelected = signupForm.querySelector("input[name=\"role\"]:checked");
    dataForm.role = roleSelected.value;
    const errorPara = document.getElementById("form-msg");
    try {
        const signupRes = await fetch("/api/auth/signup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(dataForm)
        });
        const signupResData = await signupRes.json();
        if (signupRes.ok) window.location.href = signupResData.user.role === "TUTOR" ? "/tutor_profil?welcome=1" : (signupResData.user.role === "STUDENT" ? "/student_profil" : "/parent_profil");
        else {
            errorPara.hidden = false;
            errorPara.textContent = signupResData.error;
        }
    } catch (error) {
        errorPara.hidden = false;
        errorPara.textContent = "Erreur Server";
        console.error(error);
    }
});

document.querySelectorAll(".pw-toggle").forEach(btn => btn.addEventListener("click", () => {
	const input = btn.parentElement.querySelector("input");
	const show = input.type === "password";
	input.type = show ? "text" : "password";
	btn.setAttribute("aria-pressed", show);
	btn.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
}));