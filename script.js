let fullWind = [];
let fullGust = [];
let fullTime = [];

async function loadWindData() {
    const url = "https://green-mouse-13a7.herbert-fux.workers.dev";

    try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("API antwortet nicht korrekt");

        const data = await response.json();
        renderWind(data);

    } catch (error) {
        console.error("Fehler beim Laden der API:", error);
        document.getElementById("update").innerText = "Fehler beim Laden der Daten";
    }
}

function windHimmelsrichtung(deg){
    if (deg >= 337.5 || deg < 22.5) return "N";
    if (deg < 67.5) return "NO";
    if (deg < 112.5) return "O";
    if (deg < 157.5) return "SO";
    if (deg < 202.5) return "S";
    if (deg < 247.5) return "SW";
    if (deg < 292.5) return "W";
    if (deg < 337.5) return "NW";
    return "?";
}

function rotateArrow(deg) {
    return `transform: rotate(${deg}deg); font-size: 28px; font-weight: 700; display:block; text-align:center;`;
}

function windColor(kn) {
    if (!Number.isFinite(kn)) return "rgb(255,255,255)";
    if (kn <= 5) return "rgb(255,255,255)";
    if (kn < 10) {
        const t = (kn - 5) / 5;
        const gray = Math.round(255 - t * 120);
        return `rgb(${gray},${gray},${gray})`;
    }
    if (kn < 20) {
        const t = (kn - 10) / 10;
        return `rgb(${180 - t*80},${255 - t*155},${180 - t*80})`;
    }
    if (kn < 29) {
        const t = (kn - 20) / 9;
        return `rgb(${255 - t*40},${240 - t*100},${120 - t*60})`;
    }
    const t = Math.min((kn - 29) / 10, 1);
    return `rgb(${255 - t*80},${180 - t*120},${60 - t*40})`;
}

function drawChart() {
    if (fullWind.length < 2) return;

    const w = fullWind.slice().reverse();
    const g = fullGust.slice().reverse();
    const t = fullTime.slice().reverse();

    const max = Math.max(...w, ...g);
    const min = Math.min(...w, ...g);

    const scaleY = v => 100 - ((v - min) / (max - min || 1)) * 100;

    const width = w.length * 36;   // <<< BREITE = 36 px pro Punkt

    const windPoints = w.map((v, i) => `${i * 36},${scaleY(v)}`).join(" ");
    const gustPoints = g.map((v, i) => `${i * 36},${scaleY(v)}`).join(" ");

    const y12 = scaleY(12);
    const y20 = scaleY(20);

    const svg = `
        <svg width="${width}" height="120">

            <!-- Hilfslinie 12 kt -->
            <line x1="0" y1="${y12}" x2="${width}" y2="${y12}" stroke="#cccccc" stroke-dasharray="4"/>
            <text x="5" y="${y12 - 5}" font-size="12" fill="#666">12 kt</text>

            <!-- Hilfslinie 20 kt -->
            <line x1="0" y1="${y20}" x2="${width}" y2="${y20}" stroke="#bbbbbb" stroke-dasharray="4"/>
            <text x="5" y="${y20 - 5}" font-size="12" fill="#666">20 kt</text>

            <!-- Wind -->
            <polyline points="${windPoints}" fill="none" stroke="#1f4e78" stroke-width="3"/>

            <!-- Gust -->
            <polyline points="${gustPoints}" fill="none" stroke="#d9534f" stroke-width="2"/>
        </svg>
    `;

    document.getElementById("windChart").innerHTML = svg;

    document.getElementById("chartLegend").innerHTML = `
        <span style="color:#1f4e78; font-weight:bold;">──── Wind</span>
        &nbsp;&nbsp;
        <span style="color:#d9534f; font-weight:bold;">──── Gust</span>
    `;

    document.getElementById("chartTime").innerText =
        `${t[0]}  —  ${t[t.length - 1]}`;
}

function renderWind(data) {
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    fullWind = [];
    fullGust = [];
    fullTime = [];

    data.forEach((entry, index) => {
        if (index % 2 !== 0) return;

        const ts = new Date(entry.datetime);
        const timeStr = ts.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });

        const kn = Number(entry.avg);
        const gust = Number(entry.gust);
        const temp = entry.temp ?? "-";
        const dir = entry.directionDegree;

        fullWind.push(kn);
        fullGust.push(gust);
        fullTime.push(timeStr);

        const himmel = windHimmelsrichtung(dir);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${timeStr}</td>
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

    drawChart();

    const now = new Date();
    document.getElementById("update").innerText =
        "Aktualisiert: " +
        now.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

loadWindData();
setInterval(loadWindData, 60000);
