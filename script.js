// rebuild 4 – API liefert direkt ein Array

async function loadWindData() {
    const url = "https://green-mouse-13a7.herbert-fux.workers.dev";

    try {
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            throw new Error("API antwortet nicht korrekt");
        }

        const json = await response.json();
        const data = json;

        renderWind(data);

    } catch (error) {
        console.error("Fehler beim Laden der API:", error);
        document.getElementById("update").innerText = "Fehler beim Laden der Daten";
    }
}

// Himmelsrichtung aus Grad berechnen
function windHimmelsrichtung(deg){
    if (deg >= 337.5 || deg < 22.5) return "N";
    if (deg >= 22.5 && deg < 67.5) return "NO";
    if (deg >= 67.5 && deg < 112.5) return "O";
    if (deg >= 112.5 && deg < 157.5) return "SO";
    if (deg >= 157.5 && deg < 202.5) return "S";
    if (deg >= 202.5 && deg < 247.5) return "SW";
    if (deg >= 247.5 && deg < 292.5) return "W";
    if (deg >= 292.5 && deg < 337.5) return "NW";
    return "?";
}

// Schöner, dicker Windpfeil
function rotateArrow(deg) {
    return `transform: rotate(${deg}deg); font-size: 28px; font-weight: 700; display:block; text-align:center;`;
}

// Farblogik für Wind & Gust
function windColor(kn) {

    // < 10 kt: weiß → grau
    if (kn < 10) {
        const t = kn / 10;
        const gray = Math.round(255 - t * 120);
        return `rgb(${gray},${gray},${gray})`;
    }

    // 10–20 kt: hellgrün → dunkelgrün
    if (kn >= 10 && kn < 20) {
        const t = (kn - 10) / 10;
        const r = Math.round(180 - t * 80);
        const g = Math.round(255 - t * 155);
        const b = Math.round(180 - t * 80);
        return `rgb(${r},${g},${b})`;
    }

    // 20–29 kt: hellgelb → dunkleres gelb
    if (kn >= 20 && kn < 29) {
        const t = (kn - 20) / 9;
        const r = Math.round(255 - t * 40);
        const g = Math.round(240 - t * 100);
        const b = Math.round(120 - t * 60);
        return `rgb(${r},${g},${b})`;
    }

    // ≥ 29 kt: hellorange → dunkelorange
    if (kn >= 29) {
        const t = Math.min((kn - 29) / 10, 1);
        const r = Math.round(255 - t * 80);
        const g = Math.round(180 - t * 120);
        const b = Math.round(60 - t * 40);
        return `rgb(${r},${g},${b})`;
    }

    return "inherit";
}

function renderWind(data) {
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    data.forEach((entry, index) => {

        const ts = new Date(entry.datetime);
        const kn = entry.avg;
        const gust = entry.gust ?? "-";
        const temp = entry.temp ?? "-";
        const dir = entry.directionDegree;

        const himmel = windHimmelsrichtung(dir);

        // Jede zweite Zeile anzeigen
        if (index % 2 !== 0) return;

        const tr = document.createElement("tr");

        // *** NEUE SPALTENREIHENFOLGE + FARBLOGIK
