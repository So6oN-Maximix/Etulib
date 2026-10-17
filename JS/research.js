function addTiles(m) {
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(m);
}
function addPrice(m, latlng, price) {
    L.marker(latlng, { icon: L.divIcon({ className: 'price-pin', html: '<span>' + price + ' €</span>', iconSize: [0, 0] }) }).addTo(m);
}

var big = null, modal = document.getElementById('map-modal');
function openMap() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (!big) {
        big = L.map('map').setView(center, 13);
        addTiles(big);
        addTutor(big, [45.4397, 4.3872], { initials: 'CM', name: 'Camille M.', subject: 'Mathématiques, lycée et prépa', rating: 4.9, reviews: 126, price: 32, text: "Agrégée, 8 ans d'expérience. Spécialité maths, terminale et prépa.", url: '/tutor' });
        big.on('click', function () { document.getElementById('tutor-panel').hidden = true; });
    }
    setTimeout(function () { big.invalidateSize(); }, 50);
}
function closeMap() { modal.hidden = true; document.body.style.overflow = ''; }

function addTutor(m, latlng, t) {
	L.marker(latlng, { icon: L.divIcon({ className: 'price-pin', html: '<span>' + t.price + ' €</span>', iconSize: [0, 0] }) })
		.addTo(m).on('click', function () { showTutor(t); });
}
function showTutor(t) {
	var $ = function (id) { return document.getElementById(id); };
	$('tp-avatar').textContent = t.initials;
	$('tp-name').textContent = t.name;
	$('tp-sub').textContent = t.subject;
	$('tp-stars').style.setProperty('--r', t.rating);
	$('tp-stars').setAttribute('aria-label', 'Note de ' + t.rating + ' sur 5');
	$('tp-rating').textContent = t.rating + ' (' + t.reviews + ' avis)';
	$('tp-price').textContent = t.price + ' €/heure';
	$('tp-text').textContent = t.text;
	$('tp-link').href = t.url;
	$('tutor-panel').hidden = false;
}

var center = [45.4397, 4.3872]; // Saint-Étienne
var mini = L.map('map-mini', { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, attributionControl: false }).setView(center, 12);
L.control.attribution({ prefix: false }).addTo(mini);
addTiles(mini);
document.getElementById('map-card').addEventListener('click', openMap);
document.getElementById('close-map').addEventListener('click', closeMap);
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMap(); });
document.getElementById('tp-close').addEventListener('click', function () { document.getElementById('tutor-panel').hidden = true; });