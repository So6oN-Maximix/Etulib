function showToast(message, type = "ok") {
	const toast = document.createElement("div");
	toast.className = "toast" + (type === "error" ? " error" : "");
	toast.textContent = message;
	const close = () => { toast.classList.add("leaving"); setTimeout(() => toast.remove(), 250); };
	toast.addEventListener("click", close);
	document.getElementById("toasts").appendChild(toast);
	setTimeout(close, 3500);
}

function updatePage(tutor) {
    updateHeader(tutor.user);
    updateBio(tutor.bio);
    initWeek(tutor.dispos);
    updateCourses(tutor.subjects, tutor.dispos, document.querySelector(".subjects"));
    updateExperiences(tutor.experiences, document.querySelector(".timeline"));
}

function updateHeader(tutorData) {
    const docHeader = document.querySelector(".page-head-inner");
    docHeader.querySelector(".avatar").textContent = `${tutorData.firstName[0]}${tutorData.lastName[0]}`.toUpperCase();
    docHeader.querySelector("h1").textContent = `${tutorData.firstName} ${tutorData.lastName.toUpperCase()}`;
    document.querySelector("title").textContent = `${tutorData.firstName} ${tutorData.lastName.toUpperCase()} - Etulib`;
}

function updateBio(bio) {
    document.querySelector(".prose").textContent = bio;
    if (bio === "") document.querySelector(".empty").hidden = false;
}

function updateCourses(subjects, availibility, selector) {
    selector.innerHTML = "";
    subjects.forEach(subject => {
        const globalPoint = document.createElement("li");
        globalPoint.setAttribute("data-duration", subject.duration);

        const infoDiv = document.createElement("div");
        infoDiv.classList.add("who");
        const subjectTitle = document.createElement("h3");
        subjectTitle.textContent = subject.title;
        const subjectDesc = document.createElement("p");
        subjectDesc.textContent = subject.bio;
        const duration = document.createElement("small");
        duration.className = "course-info";
        duration.textContent = courseInfo(subject);
        infoDiv.appendChild(subjectTitle);
        infoDiv.appendChild(subjectDesc);
        infoDiv.appendChild(duration);

        const priceDiv = document.createElement("div");
        priceDiv.classList.add("price");
        priceDiv.innerHTML = `${subject.hourlyRate} €<small>/heure</small>`;

        globalPoint.appendChild(infoDiv);
        globalPoint.appendChild(priceDiv);

        globalPoint.onclick = event => {
            event.preventDefault();
            updateAvailibility(subject, subject.duration, availibility, document.querySelector(".slots"));
        }

        selector.appendChild(globalPoint);
    });
}

function updateAvailibility(subject, duration, availibility, selector) {
    const booking = document.querySelector(".booking");
    if (!booking.classList.contains("visible")) {
        booking.classList.add("visible");
        if (matchMedia("(max-width:900px)").matches) booking.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth", block: "start" });
    }
    document.getElementById("booking-course").textContent = subject.title;
    document.getElementById("booking-course").setAttribute("data-duration", duration);
    document.getElementById("to-book-price").innerHTML = `${subject.hourlyRate} €<small>/heure</small>`;
    document.getElementById("booking-info").textContent = courseInfo(subject);
    updateAvailibilities(availibility, duration, selector);
}

function updateExperiences(experiences, selector) {
    selector.innerHTML = "";
    experiences.forEach(exp => {
        const globalPoint = document.createElement("li");

        const date = document.createElement("b");
        date.textContent = exp.endYear === null ? `Depuis ${exp.startYear}` : `${exp.startYear} à ${exp.endYear}`;

        const expDesc = document.createElement("div");
        const expTitle = document.createElement("span");
        expTitle.textContent = exp.title;
        const expLocation = document.createElement("small");
        expLocation.textContent = exp.location;
        expDesc.appendChild(expTitle);
        expDesc.appendChild(expLocation);

        globalPoint.appendChild(date);
        globalPoint.appendChild(expDesc);
        selector.appendChild(globalPoint);
    });
}

function initWeek(dispos) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    initialMonday = new Date(today);
    initialMonday.setDate(today.getDate() + diffToMonday);
    initialMonday.setHours(0, 0, 0, 0);

    currentMonday = new Date(initialMonday);

    document.getElementById("prev-week").onclick = event => {
        event.preventDefault();
        if (currentMonday > initialMonday) {
            currentMonday.setDate(currentMonday.getDate() - 7);
            renderWeek(dispos);
        }
    };

    document.getElementById("next-week").onclick = event => {
        event.preventDefault();
        currentMonday.setDate(currentMonday.getDate() + 7);
        renderWeek(dispos);
    };

    renderWeek(dispos);
}

function renderWeek(dispos) {
    const weekLabel = document.getElementById("week-label");
    updateWeekText(currentMonday, weekLabel);
    document.getElementById("prev-week").style.visibility = currentMonday <= initialMonday ? "hidden" : "visible";
    updateAvailibilities(dispos, document.getElementById("booking-course").getAttribute("data-duration"), document.querySelector(".slots"));
}

function updateWeekText(monday, weekLabel) {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatOpts = { day: "numeric", month: "short" };
    const startStr = monday.toLocaleDateString("fr-FR", formatOpts);
    const endStr = sunday.toLocaleDateString("fr-FR", formatOpts);

    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0'); 
    const day = String(monday.getDate()).padStart(2, '0');

    weekLabel.textContent = `${startStr} — ${endStr}`;
    weekLabel.setAttribute("data-start", `${year}/${month}/${day}`);
}

function updateAvailibilities(dispos, duration, selector) {
    selector.innerHTML = "";
    dispos.forEach(dispo => {
        const todayDayIndex = ((new Date(Date.now())).getDay() - 1) % 7;
        const monday = new Date(document.getElementById("week-label").getAttribute("data-start"));
        monday.setDate(monday.getDate() + dispo.day);
        if (monday <= new Date(Date.now()) && dispo.day < todayDayIndex) return;

        const count = Math.max(0, Math.floor((dispo.endMin - duration - dispo.startMin) / 30) + 1);
        if (count <= 0) return;

        const slots = Array.from({ length: count }, (_, i) => dispo.startMin + i * 30);
        let hoursDiv = selector.querySelector(`div[data-day="${dispo.day}"]`);
        if (!hoursDiv) {
            newDay = document.createElement("p");
            const options = { weekday: "short", day: "numeric", month: "short" };
            const rawDate = monday.toLocaleDateString("fr-FR", options);
            const formattedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
            newDay.textContent = formattedDate;
            selector.appendChild(newDay);

            hoursDiv = document.createElement("div");
            hoursDiv.setAttribute("data-day", dispo.day);
            selector.appendChild(hoursDiv);
        }
        slots.forEach(slot => {
            const hourElem = document.createElement("a");
            hourElem.textContent = formatHours(slot);
            hourElem.onclick = event => {
                event.preventDefault();
                if (hourElem.classList.contains("selected")) {
                    hourElem.classList.remove("selected");
                    return;
                }
                const selected = document.querySelector(".selected")
                if (selected) selected.classList.remove("selected");
                hourElem.classList.add("selected");
            };
            hoursDiv.appendChild(hourElem);
        });
    });
}

function modeTags(mode) {
	const box = document.createElement("div");
	box.className = "tags";
	(MODE_LABELS[mode] || []).forEach(label => {
		const span = document.createElement("span");
		span.textContent = label;
		box.append(span);
	});
	return box;
}

function formatHours(minutes) { return `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`; }
function formatDuration(minutes) {
	if (minutes < 60) return `${minutes} min`;
	const h = Math.floor(minutes / 60), m = minutes % 60;
	return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

let currentMonday = null;
let initialMonday = null;

const MODE_TEXT = { EN_LIGNE: "En ligne", DOMICILE: "À domicile", TOUS: "En ligne ou à domicile" };
const courseInfo = course => `${formatDuration(course.duration)} · ${MODE_TEXT[course.mode] ?? ""}`;

const reserveBtn = document.querySelector(".btn-search");

document.addEventListener("DOMContentLoaded", async () => {
    const tutorId = new URLSearchParams(location.search).get("id");
    const res = await fetch(`/api/public/tutor/${encodeURIComponent(tutorId)}`, { method: "GET" });
    if (!res.ok || !tutorId) {
        const data = await res.json();
        console.error(data.error);
        return window.location.href = "/tutor_not_found";
    }
    
    updatePage((await res.json()).tutor);
});

reserveBtn.onclick = event => {
    event.preventDefault();
    const selectedHours = document.querySelector(".selected");
    const reserveDate = new Date(currentMonday);
    reserveDate.setDate(reserveDate.getDate() + selectedHours.parentElement.getAttribute("data-day"));
    console.log(selectedHours);
    console.log(currentMonday);
};