"use strict";

// Alle Beispiel-Bereiche. Ausgewertet werden nur die Elemente darin.
const beispiele = document.querySelectorAll(".beispiel");

// 1. Quelltext jedes Beispiels unter dem Beispiel anzeigen
//    (vor Schritt 2, damit die Hilfsattribute nicht im Quelltext erscheinen)
function einruecken(text) {
  const zeilen = text.replace(/^\s*\n|\n\s*$/g, "").split("\n");
  const einzug = Math.min(...zeilen.filter((z) => z.trim()).map((z) => z.match(/^ */)[0].length));
  return zeilen.map((z) => z.slice(einzug)).join("\n");
}

beispiele.forEach((beispiel) => {
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  // innerHTML schreibt boolesche Attribute als reversed="" – für die Anzeige kürzen
  code.textContent = einruecken(beispiel.innerHTML).replace(/ (reversed)=""/g, " $1");
  pre.className = "quelltext";
  pre.append(code);
  beispiel.after(pre);
});

// 2. Jedes Listen-Element bekommt eine Beschriftung wie "ol[start=4] · 2 Einträge".
//    Die CSS-Regel [data-label]::before zeigt sie in der Strukturansicht an.
function linkArt(a) {
  const href = a.getAttribute("href");
  if (href.startsWith("#")) return "Sprungmarke";
  return href.includes("#") ? "Dokument + Sprungmarke" : "Dokument";
}

function beschriftung(element) {
  const tag = element.tagName.toLowerCase();
  let text = tag;
  for (const attr of ["start", "reversed", "type"]) {
    if (element.hasAttribute(attr)) {
      const wert = element.getAttribute(attr);
      text += wert ? `[${attr}=${wert}]` : `[${attr}]`;
    }
  }
  if (tag === "ul" || tag === "ol") text += ` · ${element.children.length} Einträge`;
  if (tag === "dl") text += ` · ${element.querySelectorAll(":scope > dt").length} Begriffe`;
  if (tag === "a") text += ` · ${linkArt(element)}`;
  return text;
}

beispiele.forEach((beispiel) => {
  beispiel.querySelectorAll("ul, ol, li, dl, dt, dd, a").forEach((element) => {
    element.dataset.label = beschriftung(element);
  });
});

// 3. Strukturansicht ein-/ausschalten
document.getElementById("struktur-schalter").addEventListener("change", (event) => {
  document.body.classList.toggle("struktur", event.target.checked);
});

// 4. Aufzählungszeichen ein-/ausschalten: Sie sind Darstellung (CSS list-style),
//    die Liste selbst bleibt im DOM unverändert
document.getElementById("marker-schalter").addEventListener("change", (event) => {
  document.body.classList.toggle("ohne-marker", !event.target.checked);
});

// 5. Selektoren ausprobieren: Treffer markieren und zählen
const buttons = document.querySelectorAll("[data-selektor]");
const treffer = document.getElementById("treffer");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const aktiv = button.getAttribute("aria-pressed") === "true";
    document.querySelectorAll(".treffer").forEach((el) => el.classList.remove("treffer"));
    buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
    treffer.textContent = "";
    if (aktiv) return;                       // zweiter Klick: Markierung aufheben

    const selektor = button.dataset.selektor;
    const elemente = [];
    beispiele.forEach((beispiel) => elemente.push(...beispiel.querySelectorAll(selektor)));
    elemente.forEach((el) => el.classList.add("treffer"));
    button.setAttribute("aria-pressed", "true");
    treffer.textContent = `${elemente.length} Treffer für querySelectorAll('${selektor}')`;
  });
});

// 6. Gültige Verschachtelung prüfen: Direkte Kinder von ul/ol dürfen nur li sein
const listen = [];
beispiele.forEach((beispiel) => listen.push(...beispiel.querySelectorAll("ul, ol")));
const fehlerhaft = listen.filter((liste) => [...liste.children].some((kind) => kind.tagName !== "LI"));
document.getElementById("listen-pruefung").textContent = fehlerhaft.length === 0
  ? `Geprüft per JavaScript: Alle ${listen.length} ul/ol-Listen dieser Seite sind korrekt verschachtelt – ` +
    "ihre direkten Kinder sind ausschließlich li."
  : `${fehlerhaft.length} Liste(n) haben direkte Kinder, die kein li sind.`;
