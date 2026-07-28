// -------------------------------------------------------------
//  Podersdorf Wind – Live API Version
//  Holt Daten direkt von getnora.app und rendert Tabelle + Pfeile
// -------------------------------------------------------------

async function loadWindData() {
    const url = "https://www.getnora.app/api/station/kite2fly-podersdorf?limit=30";

    try {
        const response = await fetch(url, { cache: "no-store" });
        const json = await response.json();

        // API liefert Daten unter json.data
        const data = json.data;

        renderWind(data);
    } catch (error) {
        console.error("Fehler beim Laden der API:", error);
        document.getElementById("update").innerText = "Fehler beim Laden der Daten";
    }
}

// -------------------------------------------------------------
//  Windrichtung → Pfeilrotation
// -------------------------------------------------------------
function rotateArrow(deg) {
    return `transform: rotate(${deg}deg);`;
}

// -------------------------------------------------------------
//  Beaufort berechnen
// -------------------------------------------------------------
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

// -------------------------------------------------------------
//  Haupt‑Renderfunktion
// -------------------------------------------------------------
function renderWind(data) {
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    data.forEach((entry, index) => {
        const ts = new Date(entry.timestamp);
        const kn = entry.wind_speed;
        const dir = entry.wind_direction;

        const beaufort = toBeaufort(kn);

        // Jede zweite Zeile anzeigen
        if (index % 2 !== 0) return;

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${ts.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}</td>
            <td>${kn.toFixed(1)}</td>
            <td>${beaufort}</td>
            <td>
                <div class="arrow" style="${rotateArrow(dir)}">↑</div>
            </td>
            <td>${dir}°</td>
        `;

        tbody.appendChild(tr);
    });

    // Update‑Zeit setzen
    const now = new Date();
    document.getElementById("update").innerText =
        "Aktualisiert: " +
        now.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// -------------------------------------------------------------
//  Start
// -------------------------------------------------------------
loadWindData();
setInterval(loadWindData, 60 * 1000); // alle 60 Sekunden neu laden
