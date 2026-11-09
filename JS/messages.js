async function loadConversations(conversations) {
    const conversationAside = document.getElementById("conversation");
    try {
        conversationAside.querySelector(".threads").innerHTML = "";
        document.getElementById("no-threads").hidden = conversations.length > 0;
        for (const conversation of conversations) {
            const getConversationInfos = await fetch(`/api/message/get-conv-infos?id=${conversation.userId}`, { method: "GET" });
            const conversationInfos = (await getConversationInfos.json()).conversationInfos;
            const getNewMsgNum = await fetch(`/api/message/get-new-msg?id=${conversation.id}`, { method: "GET" });
            const newMsgNum = await getNewMsgNum.json();
            addConversation(conversation, conversationInfos, newMsgNum, conversationAside.querySelector(".threads"));
        }
    } catch (error) { console.error(error) }
}

function formatMsgDate(dateInput) {
    if (!dateInput) return "";

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMsgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffInDays = Math.round((startOfToday - startOfMsgDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
        return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } 
    
    if (diffInDays > 0 && diffInDays < 7) {
        let dayStr = date.toLocaleDateString("fr-FR", { weekday: "short" });
        dayStr = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
        return dayStr.endsWith(".") ? dayStr : `${dayStr}.`;
    } 
    
    const sameYear = date.getFullYear() === now.getFullYear();
    return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        ...(sameYear ? {} : { year: "2-digit" })
    });
}

function addConversation(conversation, conversationInfos, newMsgCount, selector) {
    const globalPoint = document.createElement("li");

    const globalLink = document.createElement("a");
    globalLink.href = "#";
    const avatar = document.createElement("span");
    avatar.classList.add("avatar");
    avatar.textContent = `${conversationInfos.firstName[0]}${conversationInfos.lastName[0]}`.toUpperCase();
    const name = document.createElement("span");
    name.classList.add("t-name");
    name.textContent = `${conversationInfos.firstName} ${conversationInfos.lastName.toUpperCase()}`;
    if (conversation.childName) name.innerHTML += `<small> · ${conversation.childName}</small>`;
    const time = document.createElement("span");
    time.classList.add("t-time");
    time.textContent = formatMsgDate(new Date(newMsgCount.createdAt));
    const preview = document.createElement("span");
    preview.classList.add("t-preview");
    preview.innerHTML = newMsgCount.body;


    globalLink.onclick = event => {
        event.preventDefault();

        if (globalLink.getAttribute("aria-current") === "true") return;
        const activeLink = selector.querySelector("a[aria-current=\"true\"]");
        if (activeLink) activeLink.removeAttribute("aria-current");
        globalLink.setAttribute("aria-current", "true");
        globalLink.classList.remove("unread");
        const badge = globalLink.querySelector(".badge");
        if (badge) {
            badge.remove();
            const allMsgUnread = document.getElementById("global-unread-badge")
            allMsgUnread.textContent = parseInt(allMsgUnread.textContent) - parseInt(badge.textContent);
            if (allMsgUnread.textContent === "0") allMsgUnread.remove();
        }

        composerForm.hidden = false;
        updateHeader(conversationInfos);
        loadMessages(conversation, conversationInfos);
    };

    globalLink.appendChild(avatar);
    globalLink.appendChild(name);
    globalLink.appendChild(time);
    globalLink.appendChild(preview);
    if (newMsgCount.count > 0) {
        globalLink.classList.add("unread");
        const badge = document.createElement("span");
        badge.classList.add("badge");
        badge.textContent = newMsgCount.count;
        globalLink.appendChild(badge);
    }
    globalPoint.appendChild(globalLink);
    selector.appendChild(globalPoint);
}

function updateHeader(conversationInfos) {
    const messagesSection = document.getElementById("messages");
    const avatarSection = messagesSection.querySelector(".thread-head")
    avatarSection.querySelector(".avatar").textContent = `${conversationInfos.firstName[0]}${conversationInfos.lastName[0]}`.toUpperCase();
    const userDetails = conversationInfos.role === "TUTOR" ? "Professeur" : "Eleve";
    avatarSection.querySelector("div").innerHTML = `<b>${conversationInfos.firstName} ${conversationInfos.lastName.toUpperCase()}</b><small>${userDetails}</small>`;
    avatarSection.querySelector("a").hidden = conversationInfos.role !== "TUTOR";
    if (conversationInfos.role === "TUTOR") avatarSection.querySelector("a").href = `/tutor?id=${conversationInfos.tutor.id}`;
}

async function loadMessages(conversation, conversationInfos) {
    try {
        const findMessages = await fetch("/api/message/get-msg", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId: conversation.id })
        });
        const result = await findMessages.json();
        MESSAGES = result.messages;

        const thread = document.getElementById("messages");
        thread.classList.toggle("read-only", Boolean(result.readOnly));
        const note = thread.querySelector(".thread-note");
        note.hidden = !result.readOnly;
        if (result.readOnly) note.textContent = `En tant que parent, vous voyez les échanges de ${conversation.childName} avec son professeur.`;

        const chatElement = document.getElementById("chat");
        chatElement.setAttribute("data-id", conversation.id);
        chatElement.innerHTML = "";
        if (MESSAGES.length > 0) MESSAGES.forEach(message => addMessage(message, chatElement));
        else showNoMessagesElement(conversationInfos, chatElement);
        scrollToBottom(false);
    } catch (error) { console.error(error) }
}

function scrollToBottom(smooth = false) {
    const chatElement = document.getElementById("chat");
    if (!chatElement) return;

    chatElement.scrollTo({
        top: chatElement.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
    });
}

function addMessage(message, selector) {
    const previousMsg = selector.querySelectorAll("div.msg");
    const globalDiv = document.createElement("div");
    if (message.senderId === 0) {
        globalDiv.classList.add("system-event");
        const text = document.createElement("span");
        text.innerHTML = message.body;
        globalDiv.appendChild(text);
    } else {
        if (previousMsg.length === 0) addDaySeparator(message.createdAt, selector);
        else {
            const date1 = new Date(previousMsg[previousMsg.length - 1].querySelector("time").getAttribute("data-time"));
            const date2 = new Date(message.createdAt);
            const isDifferentDay = date1.toDateString() !== date2.toDateString();
            if (isDifferentDay) addDaySeparator(message.createdAt, selector);
        }

        globalDiv.classList.add("msg");
        message.myId === message.senderId ? globalDiv.classList.add("out") : globalDiv.classList.add("in");
        globalDiv.innerHTML = `
            ${message.body}
            <time>${formatTime(new Date(message.createdAt))}</time>
        `;
        globalDiv.querySelector("time").setAttribute("data-time", message.createdAt);

        if (message.attachments && message.attachments.length > 0) {
            const time = globalDiv.querySelector("time");
            message.attachments.forEach(file => globalDiv.insertBefore(addAttachFile(file), time));
        }
    }
    selector.appendChild(globalDiv);
}

function addAttachFile(file) {
    const globalDiv = document.createElement("div");
    globalDiv.classList.add("msg-file");

    const ext = document.createElement("span");
    ext.classList.add("file-ext");
    ext.textContent = MIME_LABELS[file.mimeType];

    const metaDiv = document.createElement("div");
    metaDiv.classList.add("file-meta");
    const titleFile = document.createElement("a");
    titleFile.href = `/api/message/attachment/${file.id}`;
    titleFile.classList.add("ul");
    titleFile.textContent = file.originalName;
    const size = document.createElement("p");
    size.classList.add("file-size");
    size.textContent = formatSize(file.size);

    metaDiv.appendChild(titleFile);
    metaDiv.appendChild(size);
    globalDiv.appendChild(ext);
    globalDiv.appendChild(metaDiv);
    return globalDiv;
}

function addDaySeparator(day, selector) {
    const sep = document.createElement("p");
    sep.classList.add("day-sep")
    const dayDate = new Date(day);
    const formattedDate = dayDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long"});
    sep.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    selector.appendChild(sep);
}

function showNoMessagesElement(conversationInfos, selector) {
    const globalDiv = document.createElement("div");
    globalDiv.classList.add("chat-empty");
    globalDiv.id = "chat-empty";

    const emptyIcon = document.createElement("span");
    emptyIcon.classList.add("chat-empty-icon");
    emptyIcon.setAttribute("aria-hidden", true);
    emptyIcon.innerHTML = "<svg viewBox=\"0 0 24 24\"><path d=\"M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z\"/></svg>";

    const noMessage = document.createElement("p");
    const noMessageBold = document.createElement("b");
    noMessageBold.textContent = "Pas encore de message";
    noMessage.appendChild(noMessageBold);

    const para = document.createElement("p");
    para.innerHTML = `Envoyez le premier message pour démarrer la conversation avec <span id="chat-empty-name">${conversationInfos.firstName} ${conversationInfos.lastName.toUpperCase()}</span>.`;

    globalDiv.appendChild(emptyIcon);
    globalDiv.appendChild(noMessage);
    globalDiv.appendChild(para);
    selector.appendChild(globalDiv);
}

function formatSize(bytes) { return bytes < 1024 * 1024 ? Math.round(bytes / 1024) + " Ko" : (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " Mo"; }

function renderPreview() {
	attachPreview.innerHTML = "";
	pendingFiles.forEach((file, index) => {
		const ext = (file.name.split(".").pop() || "").slice(0, 4).toUpperCase();

		const item = document.createElement("div");
		item.className = "preview-file";
		item.innerHTML = `
			<span class="file-ext">${ext}</span>
			<div class="file-meta">
				<span class="file-name">${file.name}</span>
				<p class="file-size">${formatSize(file.size)}</p>
			</div>
			<button type="button" class="remove-file-btn" aria-label="Retirer la pièce jointe">&times;</button>
		`;
		item.querySelector(".file-ext").textContent = ext;
		item.querySelector(".file-name").textContent = file.name;
		item.querySelector(".remove-file-btn").onclick = () => {
			pendingFiles.splice(index, 1);
			renderPreview();
		};
		attachPreview.appendChild(item);
	});
}

const composerForm = document.getElementById("composer");
const attachBtn = document.getElementById("attach-btn");
const fileInput = document.getElementById("msg-file");
const attachPreview = document.getElementById("attach-preview");

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;
let pendingFiles = [];

const MIME_LABELS = {
    "application/pdf": "PDF",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
    "application/zip": "ZIP",
    "application/json": "JSON",
    "application/javascript": "JS",
    "text/javascript": "JS",
    "text/plain": "TXT",
    "text/csv": "CSV",
    "text/html": "HTML",
    "text/markdown": "MD"
};

let MESSAGES;

document.addEventListener("DOMContentLoaded", async () => {
    const getConversations = await fetch("/api/message/get-conversation", { method: "GET" });
    const conversations = (await getConversations.json()).conversations;

    loadConversations(conversations);
    loadUnreadMsg();
});

composerForm.addEventListener("submit", async event => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("message", composerForm.elements.message.value);
    formData.append("conversationId", document.getElementById("chat").getAttribute("data-id"));
    pendingFiles.forEach(file => formData.append("files", file));
    try {
        const sendMessage = await fetch("/api/message/send", {
            method: "POST",
            body: formData
        });
        const data = await sendMessage.json();
        if (!sendMessage.ok) {
            console.error(data.error);
            showToast(data.error, "error");
            return;
        }
        MESSAGES.push(data);
        addMessage(MESSAGES[MESSAGES.length - 1], document.getElementById("chat"));
        composerForm.reset();
        pendingFiles = [];
        renderPreview();
        scrollToBottom(true);
    } catch (error) {
        console.error(error);
        showToast("Erreur server", "error");
    }
});

attachBtn.onclick = () => fileInput.click();

fileInput.addEventListener("change", () => {
	for (const file of fileInput.files) {
		if (pendingFiles.length >= MAX_FILES) break;
		if (file.size > MAX_SIZE) continue;
		const already = pendingFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified);
		if (!already) pendingFiles.push(file);
	}
	fileInput.value = "";
	renderPreview();
    console.group(pendingFiles);
});