function showToast(message, type = "ok") {
	const toast = document.createElement("div");
	toast.className = "toast" + (type === "error" ? " error" : "");
	toast.textContent = message;
	const close = () => { toast.classList.add("leaving"); setTimeout(() => toast.remove(), 250); };
	toast.addEventListener("click", close);
	document.getElementById("toasts").appendChild(toast);
	setTimeout(close, 3500);
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