function updateHeader(studentData) {
    const docHeader = document.querySelector(".page-head-inner");
    docHeader.querySelector(".avatar").textContent = `${studentData.firstName[0]}${studentData.lastName[0]}`.toUpperCase();
    docHeader.querySelector("h1").textContent = `${studentData.firstName} ${studentData.lastName.toUpperCase()}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    const getStudentInfo = await fetch("/api/auth/me");
    const studentData = await getStudentInfo.json();
    updateHeader(studentData.user);
});