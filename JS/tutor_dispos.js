function loadDispos() {
	const root = document.getElementById("planner");
	const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
	const START = 8, END = 21, SLOTS = (END - START) * 2;
	const el = (tag, cls, text = "") => Object.assign(document.createElement(tag), { className: cls || "", textContent: text });

	root.append(el("div"), ...DAYS.map(d => el("div", "day", d)));
	for (let s = 0; s < SLOTS; s++) {
		root.append(el("div", "hour", s % 2 ? "" : `${START + s / 2} h`));
		for (let d = 0; d < 7; d++) root.append(el("div", s % 2 ? "cell" : "cell hr"));
	}

	const cells = [...root.querySelectorAll(".cell")];   // la case (jour d, créneau s) est cells[s * 7 + d]
	const at = (d, s) => cells[s * 7 + d];
	const cellAt = e => { const c = document.elementFromPoint(e.clientX, e.clientY); return cells.includes(c) ? c : null; };
	let drag = null;

	function select(c) {   // rectangle entre la case de départ et la case sous le curseur
		const i = cells.indexOf(c);
		const [d1, d2] = [drag.d, i % 7].sort((a, b) => a - b);
		const [s1, s2] = [drag.s, Math.floor(i / 7)].sort((a, b) => a - b);
		cells.forEach((cell, k) => cell.classList.toggle("on", drag.snap[k]));   // revient à l'état de départ
		for (let s = s1; s <= s2; s++)
			for (let d = d1; d <= d2; d++) at(d, s).classList.toggle("on", drag.add);
	}

	root.addEventListener("pointerdown", e => {
		const c = cellAt(e);
		if (!c) return;
		e.preventDefault();
		const i = cells.indexOf(c);
		drag = { d: i % 7, s: Math.floor(i / 7), add: !c.classList.contains("on"), snap: cells.map(x => x.classList.contains("on")) };
		select(c);
	});
	window.addEventListener("pointermove", e => { const c = drag && cellAt(e); if (c) select(c); });
	["pointerup", "pointercancel"].forEach(t => window.addEventListener(t, () => { drag = null; }));

	const time = s => { const m = START * 60 + s * 30; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
	const slot = t => { const [h, m] = t.split(":").map(Number); return (h * 60 + m - START * 60) / 30; };

	return {
		get() {   // [{ day: 0, start: "17:00", end: "19:30" }, ...]
			const out = [];
			for (let d = 0; d < 7; d++) {
				let start = null;
				for (let s = 0; s <= SLOTS; s++) {
					const on = s < SLOTS && at(d, s).classList.contains("on");
					if (on && start === null) start = s;
					if (!on && start !== null) { out.push({ day: d, start: time(start), end: time(s) }); start = null; }
				}
			}
			return out;
		},
		set(ranges) {   // même format, pour réafficher un planning enregistré
			cells.forEach(c => c.classList.remove("on"));
			ranges.forEach(r => { for (let s = slot(r.start); s < slot(r.end); s++) at(r.day, s).classList.add("on"); });
		}
	};
}