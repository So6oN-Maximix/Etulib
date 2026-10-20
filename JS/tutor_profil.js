function showToast(message, type = "ok") {
	const toast = document.createElement("div");
	toast.className = "toast" + (type === "error" ? " error" : "");
	toast.textContent = message;
	const close = () => { toast.classList.add("leaving"); setTimeout(() => toast.remove(), 250); };
	toast.addEventListener("click", close);
	document.getElementById("toasts").appendChild(toast);
	setTimeout(close, 3500);
}

function updateHeader(tutorData) {
    const docHeader = document.querySelector(".page-head-inner");
    docHeader.querySelector(".avatar").textContent = `${tutorData.firstName[0]}${tutorData.lastName[0]}`.toUpperCase();
    docHeader.querySelector("h1").textContent = `${tutorData.firstName} ${tutorData.lastName.toUpperCase()}`;
    document.getElementById("tutor-role").textContent = getSubjects().length > 0 ? `Professeur de ${getSubjects().join(", ")}.` : "Professeur.";
    document.getElementById("member-since").textContent = `Membre depuis ${new Date(tutorData.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}.`;
}

async function loadBio() {
    try {
        const bioRequest = await fetch("/api/tutor/get-bio", { method: "GET" });
        const tutorBio = await bioRequest.json();
        document.getElementById("tutor-bio").textContent = tutorBio.bio;
    } catch (error) { console.error(error); }
}

function getSubjects() {
    let subjects = [];
    COURSES.forEach(course => {
        if (!subjects.includes(course.subject.toLowerCase())) subjects.push(course.subject.toLowerCase());
    });
    return subjects.map(sub => sub.charAt(0).toUpperCase() + sub.slice(1));
}

async function getCourses() {
    try {
        const tutorCoursesRes = await fetch("/api/tutor/courses", { method: "GET" });
        const tutorCourses = await tutorCoursesRes.json();
        return tutorCourses.courses;
    } catch (error) { console.error(error); }
}

async function getExperiences() {
    try {
        const tutorExpsRes = await fetch("/api/tutor/experiences", { method: "GET" });
        const tutorExps = await tutorExpsRes.json();
        return tutorExps.experiences;
    } catch (error) { console.error(error); }
}

async function getAvailibilities() {
	try {
		const res = await fetch("/api/tutor/get-availibility");
		if (!res.ok) return [];
		return (await res.json()).availibilities;
	} catch (error) {
		console.error(error);
		return [];
	}
}

function loadCourses() {
    const coursesList = document.getElementById("mes-cours").querySelector("ul.courses");
    coursesList.innerHTML = "";
    document.getElementById("no-courses").hidden = COURSES.length > 0;
    COURSES.forEach(course => addCourse(course, coursesList));
}

function formatTime(minutes) {
    if (minutes < 60) return `${minutes}min`;
    return `${Math.floor(minutes / 60)}h${(minutes % 60).toString().padStart(2, "0")}`;
}

function addCourse(course, selector) {
    const globalPoint = document.createElement("li");

    const courseDescDiv = document.createElement("div");
    courseDescDiv.classList.add("who");
    const subjectElem = document.createElement("h3");
    subjectElem.textContent = course.title;
    const courseDescElem = document.createElement("p");
    courseDescElem.textContent = `${course.bio}. ${formatTime(course.duration)}, ${course.mode === "TOUS" ? "en ligne ou à domicile." : course.mode.toLowerCase().replace("_", " ")}`;
    courseDescDiv.appendChild(subjectElem);
    courseDescDiv.appendChild(courseDescElem);

    const ratingPriceDiv = document.createElement("div");
    ratingPriceDiv.classList.add("price");
    ratingPriceDiv.innerHTML = `${course.hourlyRate} €<small>/heure</small>`;

    const actionsDiv = document.createElement("div");
    actionsDiv.classList.add("course-actions");
    const modifyLink = document.createElement("a");
    modifyLink.classList.add("btn-line");
    modifyLink.textContent = "Modifier";
    modifyLink.onclick = () => {
        courseForm.setAttribute("data-id", course.id);
        const formElem = courseForm.elements;
        formElem.title.value = course.title;
        formElem.subject.value = course.subject;
        formElem.level.value = course.level;
        formElem.bio.value = course.bio;
        formElem.hourlyRate.value = course.hourlyRate;
        formElem.duration.value = course.duration;
        formElem.mode.value = course.mode;
        courseForm.hidden = false;
    };
    const deleteLink = document.createElement("a");
    deleteLink.classList.add("link-quiet");
    deleteLink.textContent = "Supprimer";
    deleteLink.onclick = () => {
        confirmCourseDeleteModal.showModal();
        document.getElementById("delete-title").textContent = "Supprimer ce cours ?";
        document.getElementById("delete-title").setAttribute("data-type", "course");
        document.getElementById("delete-name").textContent = course.title;
        document.getElementById("delete-name").setAttribute("data-id", course.id);
    };
    actionsDiv.appendChild(modifyLink);
    actionsDiv.appendChild(deleteLink);

    globalPoint.appendChild(courseDescDiv);
    globalPoint.appendChild(ratingPriceDiv);
    globalPoint.appendChild(actionsDiv);
    selector.appendChild(globalPoint);
}

function loadExperiences() {
    const expsList = document.getElementById("path-list");
    expsList.innerHTML = "";
    document.getElementById("no-path").hidden = EXPERIENCES.length > 0;
    EXPERIENCES.forEach(exp => addExperience(exp, expsList));
}

function addExperience(exp, selector) {
    const globalPoint = document.createElement("li");

    const expDescDiv = document.createElement("div");
    expDescDiv.classList.add("who");
    const expTitle = document.createElement("h3");
    expTitle.textContent = exp.title;
    const expLocation = document.createElement("p");
    const dateElem = exp.endYear ? `De ${exp.startYear} à ${exp.endYear}` : `Depuis ${exp.startYear}`;
    expLocation.textContent = `${exp.location}. ${dateElem}`;
    expDescDiv.appendChild(expTitle);
    expDescDiv.appendChild(expLocation);

    const expActionsDiv = document.createElement("div");
    expActionsDiv.classList.add("course-actions");
    const modifyLink = document.createElement("a");
    modifyLink.classList.add("btn-line");
    modifyLink.textContent = "Modifier";
    modifyLink.onclick = () => {
        pathForm.setAttribute("data-id", exp.id);
        const formElem = pathForm.elements;
        formElem.title.value = exp.title;
        formElem.location.value = exp.location;
        formElem.startYear.value = exp.startYear;
        formElem.endYear.value = exp.endYear;
        pathForm.hidden = false;
    };
    const deleteLink = document.createElement("a");
    deleteLink.classList.add("link-quiet");
    deleteLink.textContent = "Supprimer";
    deleteLink.onclick = () => {
        confirmCourseDeleteModal.showModal();
        document.getElementById("delete-title").textContent = "Supprimer cette expérience ?";
        document.getElementById("delete-title").setAttribute("data-type", "experience");
        document.getElementById("delete-name").textContent = exp.title;
        document.getElementById("delete-name").setAttribute("data-id", exp.id);
    };
    expActionsDiv.appendChild(modifyLink);
    expActionsDiv.appendChild(deleteLink);

    globalPoint.appendChild(expDescDiv);
    globalPoint.appendChild(expActionsDiv);
    selector.appendChild(globalPoint);
}

function initScrollSpy() {
	const items = [...document.querySelectorAll('.side-nav a[href^="#"]')]
		.filter(a => a.hash.length > 1)
		.map(a => ({ link: a, section: document.querySelector(a.hash) }))
		.filter(i => i.section);
	const offset = 120;

	function update() {
		let current = items[0];
		for (const i of items) if (i.section.getBoundingClientRect().top <= offset) current = i;
		if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) current = items[items.length - 1];
		items.forEach(i => i.link.removeAttribute("aria-current"));
		current.link.setAttribute("aria-current", "page");
	}

	let ticking = false;
	window.addEventListener("scroll", () => {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => { update(); ticking = false; });
	}, { passive: true });
	window.addEventListener("resize", update);
	update();
}

async function deleteLine(deleteMsg, type) {
    const idToDelete = document.getElementById("delete-name").getAttribute("data-id");
    const res = await fetch(`/api/tutor/delete-${type}/${idToDelete}`, { method: "DELETE" });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        deleteMsg.textContent = data.error || `Impossible de supprimer l${type === "cours" ? "e cours" : "'expérience"}, réessayez.`;
        deleteMsg.hidden = false;
        return;
    }
    if (type === "course"){
        COURSES = COURSES.filter(course => course.id != parseInt(idToDelete));
        loadCourses();
    } else {
        EXPERIENCES = EXPERIENCES.filter(exp => exp.id != parseInt(idToDelete));
        loadExperiences();
    }
    deleteModal.close();
    document.getElementById("delete-name").removeAttribute("data-id");
    showToast("Supprimé avec succès");
}

async function addToDb(route, dataForm, msg) {
    const sendRequest = await fetch(`/api/tutor/${route}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(dataForm)
    });
    if (!sendRequest.ok) {
        const data = await sendRequest.json().catch(() => ({}));
        msg.textContent = data.error || "Impossible d'ajouter le cours, réessayez";
        msg.hidden = false;
        return;
    }
    return await sendRequest.json();
}

async function modifyDb(route, modifiedId, dataForm, msg) {
    const modification = await fetch(`/api/tutor/${route}/${modifiedId}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(dataForm)
    });
    if (!modification.ok) {
        const data = await modification.json().catch(() => ({}));
        msg.textContent = data.error || "Impossible de modifier le cours, réessayez";
        msg.hidden = false;
        return;
    }
    return await modification.json();
}

function pushList(type, resServer) {
    if (type === "course") COURSES.push(resServer.addCourseToDB);
    else {
        EXPERIENCES.push(resServer.addExpToDB);
        EXPERIENCES.sort((a, b) => (b.endYear ?? Infinity) - (a.endYear ?? Infinity) || b.startYear - a.startYear);
    }
}

function mapList(type, resServer) {
    if (type === "course") COURSES = COURSES.map(c => c.id === resServer.findElem.id ? resServer.findElem : c);
    else {
        EXPERIENCES = EXPERIENCES.map(exp => exp.id === resServer.findElem.id ? resServer.findElem : exp);
        EXPERIENCES.sort((a, b) => (b.endYear ?? Infinity) - (a.endYear ?? Infinity) || b.startYear - a.startYear);
    }
}

async function processRoutes(form, modifiedId, type, dataForm, msg, loadFunction) {
    if (!modifiedId) {
        const resServer = await addToDb(`add-${type}`, dataForm, msg);
        if (!resServer) return;
        pushList(type, resServer);
    } else {
        const resServer = await modifyDb(`update-${type}`, modifiedId, dataForm, msg);
        if (!resServer) return;
        mapList(type, resServer);
    }
    loadFunction();
    form.reset();
    form.removeAttribute("data-id");
    form.hidden = true;
    showToast(modifiedId ? "Modifications enregistrées" : "Ajouté avec succès");
}

async function processSubmit(event, form) {
    event.preventDefault();
    const type = form.id.includes("course") ? "course" : "experience";
    const loadFunction = form.id.includes("course") ? loadCourses : loadExperiences
    const dataForm = Object.fromEntries(new FormData(form));
    const modifiedId = form.getAttribute("data-id");
    const msg = document.getElementById(`${type}-msg`);
    msg.hidden = true;
    try { await processRoutes(form, modifiedId, type, dataForm, msg, loadFunction); }
    catch (error) {
        console.error(error);
        msg.textContent = "Erreur serveur, réessayez plus tard";
        msg.hidden = false;
    }
}

function processModals(form, addBtn, cancelBtn) {
    addBtn.onclick = () => {
        form.hidden = !form.hidden;
        form.reset();
        form.removeAttribute("data-id");
    };
    cancelBtn.onclick = () => {
        form.hidden = true;
        form.reset();
        form.removeAttribute("data-id");
    };
}

const addCourseBtn = document.getElementById("add-course");
const courseForm = document.getElementById("course-form");
const courseFormCancel = document.getElementById("course-form-cancel");

const onboardingModal = document.getElementById("onboarding-modal");
const confirmCourseDeleteModal = document.getElementById("delete-modal");
const deleteModal = document.getElementById("delete-modal");

const addPathBtn = document.getElementById("add-path");
const pathForm = document.getElementById("path-form");
const pathFormCancel = document.getElementById("path-form-cancel");

const bioForm = document.getElementById("bio-form");
const savePlanner = document.getElementById("save-planner");

let COURSES = [];
let EXPERIENCES = [];
let PLANNER = [];

if (new URLSearchParams(location.search).has("welcome")) {
	onboardingModal.showModal();
	history.replaceState(null, "", "/tutor_profil");
}
document.getElementById("onboarding-later").addEventListener("click", e => { e.preventDefault(); onboardingModal.close(); });

document.addEventListener("DOMContentLoaded", async () => {
    const getTutorInfo = await fetch("/api/auth/me");
    const tutorData = await getTutorInfo.json();

    COURSES = await getCourses();
    EXPERIENCES = await getExperiences();
    PLANNER = loadDispos();

    PLANNER.set(await getAvailibilities());
    updateHeader(tutorData.user);
    loadBio();
    loadExperiences();
    loadCourses();
    initScrollSpy();

    processModals(courseForm, addCourseBtn, courseFormCancel);
    processModals(pathForm, addPathBtn, pathFormCancel);
});

courseForm.addEventListener("submit", async event => await processSubmit(event, courseForm));
pathForm.addEventListener("submit", async event => await processSubmit(event, pathForm));

document.querySelector('#delete-modal button[value="confirm"]').addEventListener("click", async event => {
	event.preventDefault();
    const deleteMsg = document.getElementById("delete-msg");
	deleteMsg.hidden = true;
    const type = document.getElementById("delete-title").getAttribute("data-type");
	try { await deleteLine(deleteMsg, type); }
    catch (error) {
		deleteMsg.textContent = "Erreur serveur, réessayez plus tard";
		deleteMsg.hidden = false;
	}
});

bioForm.addEventListener("submit", async event => {
    event.preventDefault();
    const dataForm = Object.fromEntries(new FormData(bioForm));
    const msg = document.getElementById("bio-msg");
    msg.hidden = true;
    try {
        const sendBio = await fetch("/api/tutor/save-bio", {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify(dataForm)
        });
        if (!sendBio.ok) {
            const data = await sendBio.json().catch(() => ({}));
            msg.textContent = data.error || "Impossible de modifier le cours, réessayez";
            msg.hidden = false;
            return;
        }
        showToast("Enregistré avec succès");
    } catch (error) {
        console.error(error);
        msg.textContent = "Erreur serveur, réessayez plus tard";
        msg.hidden = false;
    }
});

savePlanner.onclick = async () => {
    try {
        const sendAvailibility = await fetch("/api/tutor/save-availibility", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planner: PLANNER.get()})
        });
        if (!sendAvailibility.ok) {
            const data = await sendAvailibility.json().catch(() => ({}));
            showToast(data.error || "Impossible d'enregistrer les disponibilités, réessayez", "error");
            return;
        }
        showToast("Disponibilités enregistrées")
    } catch (error) {
        console.error(error);
        showToast("Erreur serveur, réessayez plus tard", "error");
    }
};