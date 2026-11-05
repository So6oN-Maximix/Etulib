function updateHeader(studentInfo) {
    const docHeader = document.querySelector(".page-head-inner");
    docHeader.querySelector(".avatar").textContent = `${studentInfo.firstName[0]}${studentInfo.lastName[0]}`.toUpperCase();
    docHeader.querySelector("h1").textContent = `${studentInfo.firstName} ${studentInfo.lastName.toUpperCase()}`;
    const createdDate = new Date(studentInfo.createdAt);
    const formatedCreatedDate = createdDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    docHeader.querySelector("p").textContent = `Eleve ${formatedLevel[studentInfo.level]}. Membre depuis ${formatedCreatedDate}`;
    const diffMs = new Date(Date.now()) - new Date(studentInfo.birthDate);
    document.getElementById("favoris").hidden = diffMs / (1000 * 60 * 60 * 24 * 365) < 18;
}

function updatePersonalInfos(studentInfo) {
    const updateList = ["firstName", "lastName", "email", "phone", "city"];
    updateList.forEach(update => document.querySelector(`input[name="${update}"]`).value = studentInfo[update]);
    document.querySelector("select[name=\"level\"]").value = studentInfo.level;
}

async function updateNextCourses() {
    try {
        const getNextCourses = await fetch(`/api/lesson/get-next${qs}`, { method: "GET" });
        const data = await getNextCourses.json();
        const nextLessonsSection = document.getElementById("cours");
        nextLessonsSection.querySelector(".lessons").innerHTML = "";
        nextLessonsSection.querySelector(".empty").hidden = data.nextLessons.length > 0;
        data.nextLessons.forEach(lesson => addLesson(lesson, nextLessonsSection.querySelector(".lessons")));
    } catch (error) { console.error(error) }
}

function addLesson(lesson, selector) {
    const globalPoint = document.createElement("li");

    const date = document.createElement("div");
    date.classList.add("date");    
    const lessonDate = new Date(lesson.startDate);
    const endDate = new Date(lessonDate);
    endDate.setMinutes(endDate.getMinutes() + lesson.course.duration);
    const dateOption = { weekday: "short", day: "numeric", month: "short" };
    const formatedDate = lessonDate.toLocaleDateString("fr-FR", dateOption).split(" ");
    date.innerHTML = `<b>${formatedDate[1]}</b>${formatedDate[0]} ${formatedDate[2]}`;

    const lessonInfo = document.createElement("div");
    lessonInfo.classList.add("who");
    const type = document.createElement("h3");
    type.textContent = `${lesson.course.subject} avec ${lesson.tutor.user.firstName} ${lesson.tutor.user.lastName.toUpperCase()}`;
    const time = document.createElement("p");
    time.textContent = `${formatTime(lessonDate)} à ${formatTime(endDate)}, ${formatedMode[lesson.course.mode]}`;
    lessonInfo.appendChild(type);
    lessonInfo.appendChild(time);

    const detailsLink = document.createElement("a");
    detailsLink.href = "#";
    detailsLink.classList.add("btn-line");
    detailsLink.textContent = "Details";
    const cancelLink = document.createElement("a");
    cancelLink.href = "#";
    cancelLink.classList.add("link-quiet");
    cancelLink.textContent = "Annuler";

    globalPoint.appendChild(date);
    globalPoint.appendChild(lessonInfo);
    globalPoint.appendChild(detailsLink);
    globalPoint.appendChild(cancelLink);
    selector.appendChild(globalPoint);
}

async function updateTutors() {
    try {
        const getPastTutors = await fetch(`/api/student/get-tutors${qs}`, { method: "GET" });
        const data = await getPastTutors.json();
        const lastTutorSection = document.getElementById("favoris");
        lastTutorSection.querySelector(".tutors").innerHTML = "";
        lastTutorSection.querySelector(".empty").hidden = data.getPastTutors.length > 0;
        data.getPastTutors.forEach(tutor => addTutor(tutor, lastTutorSection.querySelector(".tutors")));
    } catch (error) { console.error(error) }
}

function addTutor(tutor, selector) {
    const globalPoint = document.createElement("li");
    globalPoint.setAttribute("data-id", tutor.id);

    const avatar = document.createElement("span");
    avatar.classList.add("avatar");
    avatar.textContent = `${tutor.user.firstName[0]}${tutor.user.lastName[0]}`.toUpperCase();

    const tutorInfos = document.createElement("div");
    tutorInfos.classList.add("who");
    const name = document.createElement("h3");
    name.textContent = `${tutor.user.firstName} ${tutor.user.lastName.toUpperCase()}`;
    const course = document.createElement("p");
    const subjects = tutor.subjects.map(subject => subject.subject);
    course.textContent = `${subjects.join(", ")} - ${tutor._count.lessons} lesson${tutor._count.lessons > 1 ? "s" : ""}`;
    tutorInfos.appendChild(name);
    tutorInfos.appendChild(course);

    const reserveBtn = document.createElement("a");
    reserveBtn.href = `/tutor?id=${tutor.id}`;
    reserveBtn.classList.add("btn-line");
    reserveBtn.textContent = "Réserver";

    globalPoint.appendChild(avatar);
    globalPoint.appendChild(tutorInfos);
    globalPoint.appendChild(reserveBtn);
    selector.appendChild(globalPoint);
}

const studentInfoForm = document.getElementById("student-info");

const childId = new URLSearchParams(location.search).get("id");
const qs = childId ? `?id=${encodeURIComponent(childId)}` : "";

document.addEventListener("DOMContentLoaded", async () => {
    const res = await fetch(`/api/student/get-info${qs}`);
	if (!res.ok) return location.replace("/parent_profil");
	const studentInfo = await res.json();

    updateHeader(studentInfo);
    updatePersonalInfos(studentInfo);
    updateNextCourses();
    updateTutors();
    initScrollSpy();
    loadUnreadMsg();
});

studentInfoForm.addEventListener("submit", async event => {
    event.preventDefault();
	const dataForm = Object.fromEntries(new FormData(studentInfoForm));
    try {
        const saveData = await fetch(`/api/student/perso-info${qs}`, {
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