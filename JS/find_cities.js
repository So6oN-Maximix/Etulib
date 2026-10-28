function showToast(message, type = "ok") {
	const toast = document.createElement("div");
	toast.className = "toast" + (type === "error" ? " error" : "");
	toast.textContent = message;
	const close = () => { toast.classList.add("leaving"); setTimeout(() => toast.remove(), 250); };
	toast.addEventListener("click", close);
	document.getElementById("toasts").appendChild(toast);
	setTimeout(close, 3500);
}

document.addEventListener("DOMContentLoaded", async () => {
    const cityInput = document.getElementById("city-input");
    const suggestionsList = document.getElementById("city-suggestions");
    let timeoutId = null;

    cityInput.addEventListener("input", event => {
        clearTimeout(timeoutId);
        const query = event.target.value.trim();

        if (query.length < 2) {
            suggestionsList.hidden = true;
            return;
        }

        timeoutId = setTimeout(async () => {
            try {
                const response = await fetch(`https://geo.api.gouv.fr/communes?nom=${query}&fields=departement&boost=population&limit=5`);
                const cities = await response.json();
                cities.sort((a, b) => b._score - a._score);

                suggestionsList.innerHTML = "";

                if (cities.length > 0) {
                    cities.forEach(city => {
                        const li = document.createElement("li");
                        li.textContent = `${city.nom} (${city.departement.code})`;
                        
                        li.addEventListener("mousedown", e => {
                            e.preventDefault();
                            cityInput.value = city.nom;
                            suggestionsList.hidden = true;
                        });

                        suggestionsList.appendChild(li);
                    });
                    suggestionsList.hidden = false;
                } else {
                    suggestionsList.hidden = true;
                }
            } catch (error) {
                console.error("Erreur lors de la recherche de ville:", error);
            }
        }, 300);
    });

    cityInput.addEventListener("blur", () => {
        suggestionsList.hidden = true;
    });
    
    cityInput.addEventListener("focus", () => {
        if (cityInput.value.length >= 2 && suggestionsList.children.length > 0) {
            suggestionsList.hidden = false;
        }
    });
});