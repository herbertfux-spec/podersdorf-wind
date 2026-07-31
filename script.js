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

/* ---------------------------------------------------------
   HEAVY ARROW BOX – dein neuer fetter Windpfeil
--------------------------------------------------------- */
function windArrowHeavyBox(deg) {
    return `
        <div style="
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            padding:2px;
        ">
            <div style="
                width:44px;
                height:44px;
                background:#ffffff;
                border-radius:14px;
                box-shadow:0 3px 8px rgba(0,0,0,0.18);
                border:3px solid #1f4e78;
                display:flex;
                justify-content:center;
                align-items:center;
            ">
                <span style="
                    font-size:34px;
                    font-weight:900;
                    transform:rotate(${deg + 180}deg);
                    transition:transform 0.25s ease-out;
                    display:inline-block;
                ">
                    ↑
                </span>
            </div>
            <div style="
                font-size:14px;
                margin-top:4px;
                opacity:0.75;
                font-family:Arial, sans-serif;
                font-weight:600;
            ">
                ${windHimmelsrichtung(deg)}
            </div>
        </div>
    `;
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

    const rawMin = Math.min(...w, ...g);
    const min = Math.max(rawMin, 4);
    const max = Math.max(...w, ...g);

    const scaleY = v => 100 - ((v - min) / (max - min || 1)) * 100;

    const width = w.length * 24;

    const windPoints = w.map((v, i) => `${i * 24},${scaleY(v)}`).join(" ");
    const gustPoints = g.map((v, i) => `${i * 24},${scaleY(v)}`).join(" ");

    const yMin = scaleY(min);
    const y12 = scaleY(12);
    const y20 = scaleY(20);
    const y29 = scaleY(29);
    const yMax = scaleY(max);

    const svg = `
        <svg width="${width}" height="170">

            <rect x="0" y="${yMin}" width="${width}" height="${y12 - yMin}" fill="#eaeaea" opacity="0.55"/>
            <rect x="0" y="${y12}" width="${width}" height="${y20 - y12}" fill="#b6e3b6" opacity="0.55"/>
            <rect x="0" y="${y20}" width="${width}" height="${y29 - y20}" fill="#fff3b0" opacity="0.55"/>
            <rect x="0" y="${y29}" width="${width}" height="${yMax - y29}" fill="#ffd2a0" opacity="0.55"/>

            <line x1="0" y1="${y12}" x2="${width}" y2="${y12}" stroke="#444" stroke-width="3" stroke-dasharray="6 4" opacity="0.9"/>
            <text x="10" y="${y12 - 10}" font-size="16" fill="#111" font-weight="700">12 kt</text>

            <line x1="0" y1="${y20}" x2="${width}" y2="${y20}" stroke="#333" stroke-width="3" stroke-dasharray="6 4" opacity="0.9"/>
            <text x="10" y="${y20 - 10}" font-size="16" fill="#111" font-weight="700">20 kt</text>

            <polyline points="${windPoints}" fill="none" stroke="#1f4e78" stroke-width="3"/>
            <polyline points="${gustPoints}" fill="none" stroke="#d9534f" stroke-width="2" stroke-dasharray="6 4"/>

            <line x1="0" y1="155" x2="${width}" y2="155" stroke="#222" stroke-width="2"/>

            ${t.map((time, i) => {
                if (i % 6 !== 0) return "";
                return `
                    <line x1="${i * 24}" y1="155" x2="${i * 24}" y2="150" stroke="#222" stroke-width="2"/>
                    <text x="${i * 24 + 3}" y="145" font-size="13" fill="#222">${time}</text>
                `;
            }).join("")}
        </svg>
    `;

    document.getElementById("windChart").innerHTML = svg;

    document.getElementById("chartLegend").innerHTML = `
        <span style="color:#1f4e78; font-weight:bold;">──── Wind</span>
        &nbsp;&nbsp;
        <span style="color:#d9534f; font-weight:bold;">- - - Gusts</span>
    `;
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

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${timeStr}</td>

            <td style="text-align:center;">
                ${windArrowHeavyBox(dir)}
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
