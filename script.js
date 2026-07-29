// rebuild 4 – API liefert direkt ein Array

let fullHistory = []; // Gesamtverlauf für Mini-Diagramm

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

    if (!Number.isFinite(kn)) return "rgb(255,255,255)";

    // 0–5 kt: immer weiß
    if (kn <= 5) {
        return "rgb(255,255,255)";
    }

    // 5–10 kt: weiß → grau
    if (kn > 5 && kn < 10) {
        const t = (kn - 5) / 5;
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

    return "rgb(255,255,255)";
}

// Mini-Diagramm (Sparkline) für Gesamtverlauf
function sparklineFull(values) {
    if (!values || values.length === 0) return "";

    const max = Math.max(...values);
    const min = Math.min(...values);

    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * 300;
        const y = 60 - ((v - min) / (max - min || 1)) * 60;
        return `${x},${y}`;
    }).join(" ");

    return `
        <svg width="300" height="60">
            <polyline 
                points="${points}" 
                fill="none" 
                stroke="#1f4e78" 
                stroke-width="3"
                stroke-linecap="round"
            />
        </svg>
    `;
}

function renderWind(data) {
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    // Gesamtverlauf aktualisieren
    fullHistory.push(...data.map(e => Number(e.avg)));
    if (fullHistory.length > 200) fullHistory.splice(0, fullHistory.length - 200);

    // Mini-Diagramm oberhalb der Tabelle aktualisieren
    document.getElementById("windChart").innerHTML = sparklineFull(fullHistory);

    data.forEach((entry, index) => {

        const ts = new Date(entry.datetime);
        const kn = Number(entry.avg);
        const gust = Number(entry.gust);
        const temp = entry.temp ?? "-";
        const dir = entry.directionDegree;

        const himmel = windHimmelsrichtung(dir);

        if (index % 2 !== 0) return;

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${ts.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}</td>

            <td style="text-align:center;">
                <div style="${rotateArrow(dir)}">↑</div>
                <div style="font-size:14px; font-weight:600; margin-top:-4px;">${himmel}</div>
            </td>

            <td style="background:${windColor(kn)}">${kn.toFixed(1)}</td>

            <td style="background:${windColor(gust)}">${gust.toFixed(1)}</td>

            <td>${temp.toFixed ? temp.toFixed(1) : temp}°C</td>
        `;

        tbody.appendChild(tr);
    });

    const now = new Date();
    document.getElementById("update").innerText =
        "Aktualisiert: " +
        now.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

loadWindData();
setInterval(loadWindData, 60000);
