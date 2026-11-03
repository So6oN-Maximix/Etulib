function updateTexts(bookingData) {
    document.querySelector("#tutor b").textContent = `${bookingData.tutor.user.firstName} ${bookingData.tutor.user.lastName.toUpperCase()}`;
    document.querySelector("#subject b").textContent = `${bookingData.course.subject}, ${formatedMode[bookingData.course.mode]}`;
    const startDate = new Date(bookingData.startDate);
    const dateOption = { weekday: "short", day: "numeric", month: "short"};
    const formatedDate = startDate.toLocaleDateString("fr-FR", dateOption);
    document.querySelector("#date b").textContent = `${formatedDate.charAt(0).toUpperCase() + formatedDate.slice(1)} à ${formatTime(startDate)}`;
    document.querySelector("#duration b").textContent = formatDuration(bookingData.course.duration);
    sessionStorage.removeItem("bookingData");
}

document.addEventListener("DOMContentLoaded", () => {
    const bookingData = JSON.parse(sessionStorage.getItem("bookingData"));
    updateTexts(bookingData);
});