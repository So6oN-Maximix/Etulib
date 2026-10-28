async function executeSearch(course, location) {
    if (!course && !location) return;
    const queryParams = new URLSearchParams({ course, location }).toString();
    const searchBtn = document.querySelector("#research-form .btn-search");
    searchBtn.classList.add("is-loading");
    searchBtn.disabled = true;
    try {
        const response = await fetch(`/api/public/search-tutor?${queryParams}`);
        const tutors = await response.json();
        if (!response.ok) {
            showToast(tutors.error || "Erreur lors de la recherche", "error");
            return;
        }
        renderTutorsList(tutors);
    } catch (error) {
        console.error(error);
        showToast("Erreur serveur", "error");
    } finally {
        searchBtn.classList.remove("is-loading");
        searchBtn.disabled = false;
    }
}

function renderTutorsList(tutors) {
    const tutorsListElem = document.querySelector(".results .tutors");
    tutorsListElem.innerHTML = "";
    tutors.forEach(tutor => addTutor(tutor, tutorsListElem));
}

function addTutor(tutor, selector) {
    tutor.subjects.forEach(subject => {
        const globalPoint = document.createElement("li");

        const avatar = document.createElement("span");
        avatar.classList.add("avatar");
        avatar.textContent = `${tutor.user.firstName[0]}${tutor.user.lastName[0]}`.toUpperCase();

        const tutorInfo = document.createElement("div");
        tutorInfo.classList.add("who");
        const name = document.createElement("h3");
        name.textContent = `${tutor.user.firstName} ${tutor.user.lastName.toUpperCase()}`;
        const bio = document.createElement("p");
        bio.textContent = subject.title;
        const tags = document.createElement("div");
        tags.classList.add("tags");
        tutorInfo.appendChild(name);
        tutorInfo.appendChild(bio);
        tutorInfo.appendChild(tags);

        // TEMPORAIRE !
        const notes = document.createElement("div");
        notes.classList.add("meta");
        notes.innerHTML = `
            <span class="stars" style="--r:4.9" role="img" aria-label="Note de 4,9 sur 5"></span>
            <span><b>4,9</b> <small>(126 avis)</small></span>
        `;

        const price = document.createElement("div");
        price.classList.add("price");
        price.innerHTML = `${subject.hourlyRate} €<small>/heure</small>`;

        const tutorProfileLink = document.createElement("a");
        tutorProfileLink.href = `/tutor?id=${parseInt(tutor.id)}`;
        tutorProfileLink.classList.add("btn-line");
        tutorProfileLink.textContent = "Voir les créneaux";

        globalPoint.appendChild(avatar);
        globalPoint.appendChild(tutorInfo);
        globalPoint.appendChild(notes);
        globalPoint.appendChild(price);
        globalPoint.appendChild(tutorProfileLink);
        selector.appendChild(globalPoint);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const researchForm = document.getElementById("research-form");
    const courseInput = researchForm.querySelector('input[name="course"]');
    const locationInput = researchForm.querySelector('input[name="location"]');

    const urlParams = new URLSearchParams(window.location.search);
    const course = urlParams.get("course") || "";
    const location = urlParams.get("location") || "";

    if (courseInput) courseInput.value = course;
    if (locationInput) locationInput.value = location;

    await executeSearch(course, location);

    researchForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const dataForm = Object.fromEntries(new FormData(researchForm));
        
        const newParams = new URLSearchParams({
            course: dataForm.course || "",
            location: dataForm.location || ""
        });

        await executeSearch(dataForm.course, dataForm.location);
    });
});