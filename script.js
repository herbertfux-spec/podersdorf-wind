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

function rotateArrow(deg) {
    return `transform: rotate(${deg}deg); font-size: 28px; font-weight: 700; display:block; text-align:center;`;
}

function toBeaufort(kn) {
    if (kn < 1) return 0;
    if (kn < 4) return 1;
    if (kn < 7) return 2;
    if (kn < 11) return 3;
    if (kn < 17) return 4;
    if (kn < 22) return 5;
    if (kn < 28) return 6;
    if (kn < 34) return 7;
    if (kn < 41) return 8;
    if (kn < 48) return 9;
    if (kn < 56) return 10;
    if (kn < 64) return 11;
    return 12;
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

        if (index % 2 !== 0) return;

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${ts.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}</td>

            <td style="text-align:center;">
                <div style="${rotateArrow(dir)}">↑</div>
                <div style="font-size:14px; font-weight:600; margin-top:-4px;">${himmel}</div>
            </td>

            <td>${kn.toFixed(1)}</td>

            <td>${gust.toFixed ? gust.toFixed(1) : gust}</td>

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
