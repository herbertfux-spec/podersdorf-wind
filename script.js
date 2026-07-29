// rebuild 4 – API liefert direkt ein Array

async function loadWindData() {
    const url = "https://still-wind-ddce.herbert-fux.workers.dev";


    try {
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            throw new Error("API antwortet nicht korrekt");
        }

        const json = await response.json();

        // API liefert direkt ein Array
        const data = json;

        renderWind(data);

    } catch (error) {
        console.error("Fehler beim Laden der API:", error);
        document.getElementById("update").innerText = "Fehler beim Laden der Daten";
    }
}

function rotateArrow(deg) {
    return `transform: rotate(${deg}deg);`;
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
        const dir = entry.directionDegree;

        const beaufort = toBeaufort(kn);

        // Jede zweite Zeile anzeigen
        if (index % 2 !== 0) return;

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${ts.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}</td>
            <td>${kn.toFixed(1)}</td>
            <td>${beaufort}</td>
            <td><div class="arrow" style="${rotateArrow(dir)}">↑</div></td>
            <td>${dir}°</td>
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
