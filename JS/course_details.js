function updateHeader(lesson) {
    const headerSection = document.getElementById("header");
    headerSection.querySelector("a").href = `/${lesson.connectedRole.toLowerCase()}_profil`;
    const actualLinkHTMLSplit = headerSection.querySelector(".crumb").innerHTML.split(" / ");
    headerSection.querySelector(".crumb").innerHTML = `${actualLinkHTMLSplit[0]} / ${lesson.course.subject}`;
    headerSection.querySelector("h1").textContent = lesson.course.title;
    const startDate = new Date(lesson.startDate);
    const formatedStartDate = startDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + lesson.course.duration);
    headerSection.querySelector("p:not([class])").textContent = `${formatedStartDate.charAt(0).toUpperCase() + formatedStartDate.slice(1)}, de ${formatTime(startDate)} à ${formatTime(endDate)}`;
    const allTags = headerSection.querySelectorAll("span");
    allTags[0].textContent = startDate >= new Date(Date.now()) ? "À venir" : "Passée";
    allTags[1].textContent = formatedMode[lesson.course.mode].charAt(0).toUpperCase() + formatedMode[lesson.course.mode].slice(1);
    allTags[2].textContent = formatDuration(lesson.course.duration);

    document.querySelector(".prose").textContent = lesson.course.bio;
}

function updateLessonInfo(lesson) {
    const lessonInfoSection = document.getElementById("lesson-info");
    const allInfoPlace = lessonInfoSection.querySelector(".facts").querySelectorAll("dd");
    allInfoPlace[0].textContent = `${lesson.course.subject} (${lesson.course.level.charAt(0) + lesson.course.level.slice(1).toLowerCase()})`;
    const startDate = new Date(lesson.startDate);
    const formatedStartDate = startDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    allInfoPlace[1].textContent = formatedStartDate.charAt(0).toUpperCase() + formatedStartDate.slice(1);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + lesson.course.duration);
    allInfoPlace[2].textContent = `${formatTime(startDate)} à ${formatTime(endDate)}`;
    allInfoPlace[3].textContent = formatedMode[lesson.course.mode].charAt(0).toUpperCase() + formatedMode[lesson.course.mode].slice(1);
    allInfoPlace[4].textContent = `${lesson.course.hourlyRate}€ / heure`;
    allInfoPlace[5].textContent = `${lesson.student.user.firstName} ${lesson.student.user.lastName.toUpperCase()}`;

    const tutorZone = lessonInfoSection.querySelector(".tutor-mini");
    tutorZone.querySelector(".avatar").textContent = `${lesson.tutor.user.firstName[0]}${lesson.tutor.user.lastName[0]}`.toUpperCase();
    tutorZone.querySelector("b").textContent = `${lesson.tutor.user.firstName} ${lesson.tutor.user.lastName.toUpperCase()}`;
    tutorZone.querySelector("small").textContent = `Professeur de ${lesson.course.subject.toLowerCase()}`;

    lessonInfoSection.querySelector(".btn-line").href = `/tutor?id=${lesson.tutor.id}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    const getLessonInfo = await fetch("/api/lesson/get-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: new URLSearchParams(location.search).get("id")})
    });
    const lesson = (await getLessonInfo.json()).lessonInfo;
    console.log(lesson);
    
    updateHeader(lesson);
    updateLessonInfo(lesson);
});