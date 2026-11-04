const HOUR_START = 8, HOUR_END = 21, ROW = 48;

function renderWeek(lessons) {
	const el = (tag, cls, text = "") => Object.assign(document.createElement(tag), { className: cls || "", textContent: text });
	const now = new Date();
	const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
	const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);

	const week = document.getElementById("week");
	week.style.setProperty("--row", ROW + "px");
	week.replaceChildren();

	const hours = el("div", "week-hours");
	hours.append(el("div", "week-day-head"));
	for (let h = HOUR_START; h < HOUR_END; h++) hours.append(el("span", "", `${h} h`));
	week.append(hours);

	let count = 0;
	for (let i = 0; i < 7; i++) {
		const day = new Date(monday); day.setDate(monday.getDate() + i);
		const col = el("div", "week-day" + (day.toDateString() === now.toDateString() ? " today" : ""));
		col.append(el("div", "week-day-head", day.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })));

		const body = el("div", "week-body");
		body.style.height = (HOUR_END - HOUR_START) * ROW + "px";
		lessons.filter(l => new Date(l.startDate).toDateString() === day.toDateString()).forEach(l => {
			const start = new Date(l.startDate);
			const minutes = start.getHours() * 60 + start.getMinutes() - HOUR_START * 60;
			const block = el("a", "week-lesson");
			block.href = `/course_details?id=${l.id}`;
			block.style.top = (minutes / 60) * ROW + "px";
			block.style.height = (l.course.duration / 60) * ROW + "px";
			block.append(el("b", "", start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })), el("span", "", l.course.subject), el("small", "", l.tutorName));
			body.append(block);
			count++;
		});
		col.append(body);
		week.append(col);
	}

	const fmt = d => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
	document.getElementById("cal-range").textContent = `${fmt(monday)} au ${fmt(sunday)}`;
	document.getElementById("no-week-lessons").hidden = count > 0;
}

document.getElementById("open-calendar").onclick = () => {
	renderWeek(LESSONS);
	document.getElementById("calendar-modal").showModal();
};