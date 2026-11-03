function updateHeader(userData) {
    const docHeader = document.querySelector(".page-head-inner");
    docHeader.querySelector(".avatar").textContent = `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase();
    docHeader.querySelector("h1").textContent = `${userData.firstName} ${userData.lastName.toUpperCase()}`;
    const children = CHILDREN.map(children => children.user.firstName);
    const parentText = CHILDREN.length <= 0 ? "Parent" : `Parent de ${children.join(", ")}`;
    const createdDate = new Date(userData.createdAt);
    const formattedCreatedDate = createdDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    docHeader.querySelector("p").textContent = `${parentText}. Membre depuis ${formattedCreatedDate}`;
}

function updatePersonalInfos(userData, parentData) {
    parentData.firstName = userData.firstName;
    parentData.lastName = userData.lastName;
    parentData.email = userData.email;
    const updateList = ["firstName", "lastName", "email", "phone", "city"];
    updateList.forEach(update => document.getElementById("infos").querySelector(`input[name="${update}"]`).value = parentData[update] ? parentData[update] : "");
}

async function getChildren() {
    try {
        const childrenReq = await fetch("/api/parent/get-children", { method: "GET" });
        const childrenRes = await childrenReq.json();
        return childrenRes.children;
    } catch (error) { console.error(error); }
}

function loadChildren() {
    const childrenZone = document.getElementById("enfants");
    childrenZone.querySelector(".empty").hidden = CHILDREN.length > 0;
    childrenZone.querySelector(".courses").innerHTML = "";
    CHILDREN.forEach(children => addChildren(children, childrenZone.querySelector(".courses")));
}

function addChildren(children, selector) {
    const globalPoint = document.createElement("li");

    const nameDiv = document.createElement("div");
    nameDiv.classList.add("who");
    const name = document.createElement("h3");
    name.textContent = `${children.user.firstName} ${children.user.lastName.toUpperCase()}`;
    const level = document.createElement("p");
    level.textContent = `${formatedLevel[children.level].charAt(0).toUpperCase() + formatedLevel[children.level].slice(1)}`;
    nameDiv.appendChild(name);
    nameDiv.appendChild(level);

    const actions = document.createElement("div");
    actions.classList.add("course-actions");
    const reserve = document.createElement("a");
    reserve.textContent = "Réserver un cours";
    reserve.classList.add("btn-line");
    reserve.href = "#";
    const profil = document.createElement("a");
    profil.textContent = "Profil";
    profil.classList.add("link-quiet");
    profil.href = `/student_profil?id=${children.user.id}`;
    actions.appendChild(reserve);
    actions.appendChild(profil);

    globalPoint.appendChild(nameDiv);
    globalPoint.appendChild(actions);
    selector.appendChild(globalPoint);
}

async function updateNextCourses() {
    try {
        const getNextCourses = await fetch(`/api/parent/get-next-lessons`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(CHILDREN.map(children => children.user.id))
        });
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
    const startDate = new Date(lesson.startDate);
    const formatedStartDate = startDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    const splitDate = formatedStartDate.split(" ");
    date.innerHTML = `<b>${splitDate[1]}</b>${splitDate[0]} ${splitDate[2]}`;

    const lessonInfo = document.createElement("div");
    lessonInfo.classList.add("who");
    const title = document.createElement("h3");
    title.textContent = `${lesson.student.user.firstName}, ${lesson.course.subject.toLowerCase()} avec ${lesson.tutor.user.firstName} ${lesson.tutor.user.lastName.toUpperCase()}`;
    const time = document.createElement("p");
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + lesson.course.duration);
    time.textContent = `${formatTime(startDate)} à ${formatTime(endDate)}, ${formatedMode[lesson.course.mode]}`;
    lessonInfo.appendChild(title);
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
        const getTutors = await fetch(`/api/parent/get-tutors`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(CHILDREN.map(children => children.user.id))
        });
        const data = await getTutors.json();
        const tutorSection = document.getElementById("professeurs");
        tutorSection.querySelector(".tutors").innerHTML = "";
        data.tutors.forEach(tutor => addTutor(tutor, tutorSection.querySelector(".tutors")));
    } catch (error) { console.error(error) }
}

function addTutor(tutor, selector) {
    const globalPoint = document.createElement("li");

    const avatar = document.createElement("span");
    avatar.classList.add("avatar");
    avatar.textContent = `${tutor.firstName[0]}${tutor.lastName[0]}`.toUpperCase();

    const tutorInfos = document.createElement("div");
    tutorInfos.classList.add("who");
    const tutorName = document.createElement("h3");
    tutorName.textContent = `${tutor.firstName} ${tutor.lastName.toUpperCase()}`;
    const infos = document.createElement("p");
    let subjects = [];
    tutor.childrenDetails.forEach(children => children.subjects.forEach(subject => {
        if (!subjects.includes(subject)) subjects.push(subject);
    }));
    infos.textContent = `${subjects.join(", ")} - ${tutor.totalLessons} séance${tutor.totalLessons > 1 ? "s" : ""}`;
    tutorInfos.appendChild(tutorName);
    tutorInfos.appendChild(infos);

    const reserveBtn = document.createElement("a");
    reserveBtn.href = `/tutor?id=${tutor.id}`;
    reserveBtn.classList.add("btn-line");
    reserveBtn.textContent = "Réserver";

    globalPoint.appendChild(avatar);
    globalPoint.appendChild(tutorInfos);
    globalPoint.appendChild(reserveBtn);
    selector.appendChild(globalPoint);
}

let CHILDREN = [];

const parnetInfoForm = document.getElementById("parent-info");

const addChildBtn = document.getElementById("add-child");
const childForm = document.getElementById("child-form");
const cancelChildFormBtn = childForm.querySelector(".link-quiet");


document.addEventListener("DOMContentLoaded", async () => {
    const getUserInfo = await fetch("/api/auth/me");
    const getParentInfo = await fetch("/api/parent/get-info", { method: "GET" });
    const userData = await getUserInfo.json();
    const parentData = await getParentInfo.json();

    updatePersonalInfos(userData.user, parentData);
    CHILDREN = await getChildren();
    updateHeader(userData.user);
    loadChildren();
    updateNextCourses();
    updateTutors();
    initScrollSpy();

    addChildBtn.onclick = event => {
        event.preventDefault();
        childForm.hidden = !childForm.hidden;
        childForm.reset();
    };
    cancelChildFormBtn.onclick = event => {
        event.preventDefault();
        childForm.hidden = true;
        childForm.reset();
    }
});

parnetInfoForm.addEventListener("submit", async event => {
    event.preventDefault();
	const dataForm = Object.fromEntries(new FormData(parnetInfoForm));
    try {
        const saveData = await fetch("/api/parent/perso-info", {
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

document.querySelectorAll(".pw-toggle").forEach(btn => btn.addEventListener("click", () => {
	const input = btn.parentElement.querySelector("input");
	const show = input.type === "password";
	input.type = show ? "text" : "password";
	btn.setAttribute("aria-pressed", show);
	btn.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
}));

childForm.addEventListener("submit", async event => {
    event.preventDefault();
    const dataForm = Object.fromEntries(new FormData(childForm));
    const msg = document.getElementById("form-msg");
    msg.hidden = true;
    try {
        const addChildReq = await fetch("/api/parent/add-child", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataForm)
        });
        const data = await addChildReq.json();
        if (!addChildReq.ok) {
            msg.textContent = data.error || "Impossible de sauvegarder les données, réessayez";
            msg.hidden = false;
            return;
        }
        CHILDREN.push(data.children);
        loadChildren();
        showToast(data.message);
        childForm.hidden = true;
    } catch (error) {
        console.error(error);
        msg.textContent = "Erreur serveur";
        msg.hidden = false;
    }
});