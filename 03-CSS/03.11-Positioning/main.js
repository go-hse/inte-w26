"use strict";

// 1. Unter jedem Beispiel die zugehörigen Regeln aus <style id="beispiel-regeln"> anzeigen –
//    im Originalwortlaut, inklusive Kommentaren. data-regeln enthält die Selektoren, getrennt durch "|".
const quelle = document.getElementById("beispiel-regeln").textContent;

function maskieren(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function regelText(selektor) {
  // Selektor am Zeilenanfang, dann alles bis zur schließenden Klammer
  const muster = new RegExp(`^[ \\t]*${maskieren(selektor)}\\s*\\{[^}]*\\}`, "m");
  const treffer = quelle.match(muster);
  if (!treffer) return "";
  const zeilen = treffer[0].split("\n");
  const einzug = Math.min(...zeilen.filter((z) => z.trim()).map((z) => z.match(/^ */)[0].length));
  return zeilen.map((z) => z.slice(einzug)).join("\n");
}

document.querySelectorAll(".beispiel[data-regeln]").forEach((beispiel) => {
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  pre.className = "quelltext";
  code.textContent = beispiel.dataset.regeln.split("|").map(regelText).filter(Boolean).join("\n");
  pre.append(code);
  beispiel.append(pre);
});

// 2. Spielwiese: position, top und left der Box live setzen, Bezugsrahmen markieren,
//    die Regeln anzeigen und erklären, was gerade passiert.
const box = document.getElementById("sw-box");
const platz = document.getElementById("sw-platz");
const eltern = document.getElementById("sw-eltern");
const auswahl = document.getElementById("sw-position");
const oben = document.getElementById("sw-top");
const links = document.getElementById("sw-left");
const anker = document.getElementById("sw-anker");

const erklaerung = {
  static: "static: Die Box steht im normalen Fluss. top und left werden ignoriert.",
  relative: "relative: Die Box wird verschoben, ihr Platz im Fluss (grau gestrichelt) bleibt reserviert. " +
    "Der Absatz danach bewegt sich nicht.",
  absolute: (mitAnker) => mitAnker
    ? "absolute: Die Box verlässt den Fluss – der Absatz danach rückt nach oben. top und left beziehen sich " +
      "auf .eltern (rot gestrichelt), weil es position: relative hat."
    : "absolute ohne positioniertes Elternelement: Kein Vorfahre ist positioniert, also beziehen sich top und " +
      "left auf die ganze Seite. Die Box ist nach links oben auf die Seite gesprungen – scrollen Sie ganz nach oben.",
  fixed: "fixed: Die Box hängt am Browserfenster, unabhängig von .eltern. Scrollen Sie die ganze Seite: " +
    "Sie bleibt links oben stehen.",
  sticky: "sticky: Scrollen Sie in der Fläche. Die Box läuft zunächst mit und bleibt stehen, sobald sie " +
    "top erreicht – aber nur, bis .eltern zu Ende ist. left wirkt bei sticky als Mindestabstand zum linken " +
    "Rand der Scrollfläche: Liegt die Box näher am Rand, rückt sie nach rechts.",
};

function aktualisieren() {
  const pos = auswahl.value;
  oben.nextElementSibling.value = `${oben.value}px`;
  links.nextElementSibling.value = `${links.value}px`;

  box.style.position = pos;
  box.style.top = `${oben.value}px`;
  box.style.left = `${links.value}px`;
  eltern.classList.toggle("anker", anker.checked);
  platz.classList.toggle("aufgeloest", pos === "sticky");

  const offsetKommentar = pos === "static" ? "  /* wirkungslos */" : "";
  document.getElementById("sw-css").textContent =
    `.eltern {\n  position: ${anker.checked ? "relative" : "static"};${anker.checked ? "" : "  /* Standard */"}\n}\n` +
    `.box {\n  position: ${pos};\n  top: ${oben.value}px;${offsetKommentar}\n  left: ${links.value}px;${offsetKommentar}\n}`;
  const text = erklaerung[pos];
  document.getElementById("sw-erklaerung").textContent = typeof text === "function" ? text(anker.checked) : text;
}

[auswahl, oben, links, anker].forEach((el) => el.addEventListener("input", aktualisieren));
aktualisieren();

// 3. Abschnitt 5: Mini-Fenster mit festem Header. Die Regeln kommen aus <style id="beispiel-regeln">,
//    damit iframe und angezeigter Quelltext garantiert übereinstimmen.
document.querySelectorAll(".mini-fenster").forEach((fenster) => {
  const variante = fenster.dataset.mini;
  const zeilen = Array.from({ length: 14 }, (_, k) =>
    `<p>${k === 0 ? "<b>Zeile 1 – der Anfang des Inhalts</b>" : `Zeile ${k + 1}`}</p>`).join("");
  fenster.srcdoc = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
    body { margin: 0; font: 15px/1.4 system-ui, Arial, sans-serif; color: #193058; }
    header.site { height: 3rem; box-sizing: border-box; padding: 0.7rem 1rem; background: #193058;
      color: white; font-weight: 600; opacity: 0.93; }
    main { padding: 0 1rem; }
    p { margin: 0.4rem 0; }
    ${regelText("header.site")}
    ${regelText(`main.${variante}`)}
  </style></head><body>
    <header class="site">Fester Header</header>
    <main class="${variante}">${zeilen}</main>
  </body></html>`;
});

// 4. Overlay öffnen und schließen
const overlay = document.getElementById("overlay");
const oeffnen = document.getElementById("overlay-auf");
function schliessen() {
  overlay.hidden = true;
  oeffnen.focus();
}
oeffnen.addEventListener("click", () => {
  overlay.hidden = false;
  document.getElementById("overlay-zu").focus();
});
overlay.addEventListener("click", (e) => {
  if (e.target === overlay || e.target.id === "overlay-zu") schliessen();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !overlay.hidden) schliessen();
});

// 5. Abschnitt 7: Stacking Context von .eltern-a ein- und ausschalten
document.getElementById("kontext-schalter").addEventListener("change", (e) => {
  document.getElementById("kontext").classList.toggle("ohne-kontext", e.target.checked);
});

// 6. Abschnitt 8: Hinweis, falls der Browser Anchor Positioning nicht kennt
if (!CSS.supports("anchor-name: --test")) {
  document.getElementById("anchor-hinweis").hidden = false;
}
