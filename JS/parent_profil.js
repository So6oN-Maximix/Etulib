function updateHeader(parentData) {
    const docHeader = document.querySelector(".page-head-inner");
    docHeader.querySelector(".avatar").textContent = `${parentData.firstName[0]}${parentData.lastName[0]}`.toUpperCase();
    docHeader.querySelector("h1").textContent = `${parentData.firstName} ${parentData.lastName.toUpperCase()}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    const getParentInfo = await fetch("/api/auth/me");
    const parentData = await getParentInfo.json();
    updateHeader(parentData.user);
});