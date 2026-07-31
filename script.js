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

    const width = w.length * 18; // etwas schmäler

    // Punkte vorbereiten
    const windPoints = w.map((v, i) => [i * 18, scaleY(v)]);
    const gustPoints = g.map((v, i) => [i * 18, scaleY(v)]);

    // Glättung: Pfad erzeugen
    const makeSmoothPath = (pts) => {
        if (pts.length < 2) return "";
        let d = `M ${pts[0][0]},${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
            const [x, y] = pts[i];
            const [px, py] = pts[i - 1];
            const cx = (px + x) / 2;
            const cy = (py + y) / 2;
            d += ` Q ${px},${py} ${cx},${cy}`;
        }
        return d;
    };

    const windPath = makeSmoothPath(windPoints);
    const gustPath = makeSmoothPath(gustPoints);

    // Zeitmarken: Anfang – Mitte – Ende
    const idxStart = 0;
    const idxMid = Math.floor(t.length / 2);
    const idxEnd = t.length - 1;

    const svg = `
        <svg viewBox="0 0 ${width} 170" width="100%" height="170" preserveAspectRatio="none">

            <!-- Hintergrundbereiche -->
            <rect x="0" y="${scaleY(min)}" width="${width}" height="${scaleY(12) - scaleY(min)}" fill="#eaeaea" opacity="0.55"/>
            <rect x="0" y="${scaleY(12)}" width="${width}" height="${scaleY(20) - scaleY(12)}" fill="#b6e3b6" opacity="0.55"/>
            <rect x="0" y="${scaleY(20)}" width="${width}" height="${scaleY(29) - scaleY(20)}" fill="#fff3b0" opacity="0.55"/>
            <rect x="0" y="${scaleY(29)}" width="${width}" height="${scaleY(max) - scaleY(29)}" fill="#ffd2a0" opacity="0.55"/>

            <!-- Hilfslinien -->
            <line x1="0" y1="${scaleY(12)}" x2="${width}" y2="${scaleY(12)}" stroke="#444" stroke-width="3" stroke-dasharray="6 4"/>
            <text x="10" y="${scaleY(12) - 10}" font-size="16" font-weight="700">12 kt</text>

            <line x1="0" y1="${scaleY(20)}" x2="${width}" y2="${scaleY(20)}" stroke="#333" stroke-width="3" stroke-dasharray="6 4"/>
            <text x="10" y="${scaleY(20) - 10}" font-size="16" font-weight="700">20 kt</text>

            <!-- Wind (glatt, dick) -->
            <path d="${windPath}" fill="none" stroke="#1f4e78" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>

            <!-- Gust (glatt, dick, gestrichelt) -->
            <path d="${gustPath}" fill="none" stroke="#d9534f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6 4"/>

            <!-- Zeitachse -->
            <line x1="0" y1="155" x2="${width}" y2="155" stroke="#222" stroke-width="2"/>

            <!-- Zeitmarken: Anfang – Mitte – Ende -->
            <line x1="${idxStart * 18}" y1="155" x2="${idxStart * 18}" y2="150" stroke="#222" stroke-width="2"/>
            <text x="${idxStart * 18 + 3}" y="145" font-size="13">${t[idxStart]}</text>

            <line x1="${idxMid * 18}" y1="155" x2="${idxMid * 18}" y2="150" stroke="#222" stroke-width="2"/>
            <text x="${idxMid * 18 + 3}" y="145" font-size="13">${t[idxMid]}</text>

            <line x1="${idxEnd * 18}" y1="155" x2="${idxEnd * 18}" y2="150" stroke="#222" stroke-width="2"/>
            <text x="${idxEnd * 18 + 3}" y="145" font-size="13">${t[idxEnd]}</text>

        </svg>
    `;

    document.getElementById("windChart").innerHTML = svg;
}

function renderWind(data) {
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    fullWind = [];
    fullGust = [];
    fullTime = [];

    data.forEach((entry, index) => {

        const ts = new Date(entry.datetime);
        const timeStr = ts.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });

        const kn = Number(entry.avg);
        const gust = Number(entry.gust);
        const temp = entry.temp ?? "-";
        const dir = entry.directionDegree;

        // Chart bekommt ALLE Werte
        fullWind.push(kn);
        fullGust.push(gust);
        fullTime.push(timeStr);

        // Tabelle nur jeden 2.
        if (index % 2 !== 0) return;

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
