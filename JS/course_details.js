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

async function loadFiles(lessonId) {
    const list = document.getElementById("docs-list");
    const noDocs = document.getElementById("no-docs");
    try {
        const getFiles = await fetch(`/api/lesson/get-files?id=${lessonId}`, { method: "GET" });
        const data = await getFiles.json();
        if (!getFiles.ok) {
            console.error(data.error);
            showToast(data.error, "error");
            return;
        }
        list.innerHTML = "";
        noDocs.hidden = data.files.length > 0;
        data.files.forEach(file => addFile(file, list));
    } catch (error) { console.error(error); }
}

function addFile(file, selector) {
    const globalPoint = document.createElement("li");

    const extSpan = document.createElement("span");
    extSpan.classList.add("file-ext");
    extSpan.textContent = (file.originalName.split(".").pop() || "").slice(0, 4).toUpperCase();
    
    const fileDetails = document.createElement("div");
    fileDetails.classList.add("who");
    const fileName = document.createElement("h3");
    fileName.textContent = file.originalName;
    const senderAndSize = document.createElement("p");
    const creationDate = new Date(file.createdAt);
    const dateOptions = { day: "numeric", month: "long" }
    if (creationDate.getFullYear() < (new Date(Date.now())).getFullYear()) dateOptions.year = "numeric";
    const formattedNow = creationDate.toLocaleDateString("fr-FR", dateOptions);
    senderAndSize.textContent = `Envoyé par ${file.mine ? "vous" : file.user.firstName} le ${formattedNow} · ${formatSize(file.size)}`;

    fileDetails.appendChild(fileName);
    fileDetails.appendChild(senderAndSize);

    const actions = document.createElement("div");
    actions.classList.add("course-actions");
    const downloadBtn = document.createElement("a");
    downloadBtn.href = "#";
    downloadBtn.classList.add("btn-line");
    downloadBtn.textContent = "Télécharger";
    actions.appendChild(downloadBtn);
    if (file.mine) {
        const trashBtn = document.createElement("button");
        trashBtn.type = "button";
        trashBtn.classList.add("btn-trash");
        trashBtn.setAttribute("aria-label", "Supprimer le document");
        trashBtn.title = "Supprimer";
        trashBtn.innerHTML = TRASH_BTN;
        actions.appendChild(trashBtn);
    } else {
        const trashBtn = document.createElement("span");
        trashBtn.classList.add("btn-trash-placeholder");
        trashBtn.setAttribute("aria-hidden", true);
        actions.appendChild(trashBtn);
    }

    globalPoint.appendChild(extSpan);
    globalPoint.appendChild(fileDetails);
    globalPoint.appendChild(actions);
    selector.prepend(globalPoint);
}

function formatSize(bytes) { return bytes < 1024 * 1024 ? Math.round(bytes / 1024) + " Ko" : (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " Mo"; }


const docInput = document.getElementById("doc-input");

const TRASH_BTN = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
`;

const MAX_SIZE = 10 * 1024 * 1024;

document.addEventListener("DOMContentLoaded", async () => {
    const getLessonInfo = await fetch("/api/lesson/get-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: new URLSearchParams(location.search).get("id")})
    });
    const lesson = (await getLessonInfo.json()).lessonInfo;
    
    updateHeader(lesson);
    updateLessonInfo(lesson);
    loadFiles(lesson.id);
});

docInput.addEventListener("change", async () => {
    for (const file of docInput.files) {
		if (file.size > MAX_SIZE) continue;
        const msg = document.getElementById("doc-msg");
        msg.hidden = true;
        try {
            const id = new URLSearchParams(location.search).get("id");
            const form = new FormData();
            form.append("file", file);
            const saveFile = await fetch(`/api/lesson/save-file?id=${id}`, {
                method: "POST",
                body: form
            });
            const data = await saveFile.json();
            if (!saveFile.ok) {
                msg.hidden = false;
                msg.textContent = data.error;
                continue;
            }
            addFile(data, document.getElementById("docs-list"));
        } catch (error) {
            msg.hidden = false;
            msg.textContent = "Erreur lors de la sauvegarde du fichier, réessayez";
            continue;
        }
    }
	docInput.value = "";
});