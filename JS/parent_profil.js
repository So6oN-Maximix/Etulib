function updateHeader(userData) {
    const docHeader = document.querySelector(".page-head-inner");
    docHeader.querySelector(".avatar").textContent = `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase();
    docHeader.querySelector("h1").textContent = `${userData.firstName} ${userData.lastName.toUpperCase()}`;
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
    level.textContent = formatLevel[children.level];
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

let CHILDREN = [];

const parnetInfoForm = document.getElementById("parent-info");

const addChildBtn = document.getElementById("add-child");
const childForm = document.getElementById("child-form");
const cancelChildFormBtn = childForm.querySelector(".link-quiet");

const formatLevel = {
    "PRIMAIRE": "En primaire",
    "COLLEGE": "Au collège",
    "LYCEE": "Au lycée",
    "SUP": "En prépa et supérieur"
};


document.addEventListener("DOMContentLoaded", async () => {
    const getUserInfo = await fetch("/api/auth/me");
    const getParentInfo = await fetch("/api/parent/get-info", { method: "GET" });
    const userData = await getUserInfo.json();
    const parentData = await getParentInfo.json();

    updateHeader(userData.user);
    updatePersonalInfos(userData.user, parentData);
    CHILDREN = await getChildren();
    loadChildren();
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