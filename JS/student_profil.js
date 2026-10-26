function updateHeader(userInfo) {
    const docHeader = document.querySelector(".page-head-inner");
    docHeader.querySelector(".avatar").textContent = `${userInfo.firstName[0]}${userInfo.lastName[0]}`.toUpperCase();
    docHeader.querySelector("h1").textContent = `${userInfo.firstName} ${userInfo.lastName.toUpperCase()}`;
}

function updatePersonalInfos(userInfo, studentIndo) {
    studentIndo.firstName = userInfo.firstName;
    studentIndo.lastName = userInfo.lastName;
    studentIndo.email = userInfo.email;
    const updateList = ["firstName", "lastName", "email", "phone", "city"];
    updateList.forEach(update => document.querySelector(`input[name="${update}"]`).value = studentIndo[update]);
    document.querySelector("select[name=\"level\"]").value = studentIndo.level;
}

const studentInfoForm = document.getElementById("student-info");

const childId = new URLSearchParams(location.search).get("id");
const qs = childId ? `?id=${encodeURIComponent(childId)}` : "";

document.addEventListener("DOMContentLoaded", async () => {
    const res = await fetch(`/api/student/get-info${qs}`);
    if (!res.ok) return location.replace("/parent_profil");

    const getUserInfo = await fetch("/api/auth/me");
    const getStudentInfo = await fetch("/api/student/get-info", { method: "GET" });
    const userInfo = await getUserInfo.json();
    const studentInfo = await getStudentInfo.json();

    updateHeader(userInfo.user);
    updatePersonalInfos(userInfo.user, studentInfo);
    initScrollSpy();
});

studentInfoForm.addEventListener("submit", async event => {
    event.preventDefault();
	const dataForm = Object.fromEntries(new FormData(studentInfoForm));
    try {
        const saveData = await fetch("/api/student/perso-info", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataForm)
        });
        const data = await saveData.json();
        if (!saveData.ok) {
            showToast(data.error || "Impossible de sauvegarder les données, réessayez", "error");
            return;
        }
        showToast(data.message);
    } catch (error) {
        console.error(error);
        showToast("Erreur Server", "error");
    }
});