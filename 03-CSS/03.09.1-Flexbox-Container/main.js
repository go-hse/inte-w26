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

// 2. Spielwiese: Richtung und Ausrichtung live setzen, Achsenpfeile nachführen
//    und die Regel als CSS anzeigen (Standardwerte sind markiert).
const container = document.getElementById("sw-container");
const auswahl = {
  "flex-direction": document.getElementById("sw-direction"),
  "justify-content": document.getElementById("sw-justify"),
  "align-items": document.getElementById("sw-align"),
};
const standard = { "flex-direction": "row", "justify-content": "flex-start", "align-items": "stretch" };
const gap = document.getElementById("sw-gap");
const anzahl = document.getElementById("sw-anzahl");
const oben = document.querySelector(".achse-oben");
const links = document.querySelector(".achse-links");
const ausgabe = document.getElementById("sw-css");

function achsenBeschriften(richtung) {
  const waagerecht = richtung.startsWith("row");
  const umgekehrt = richtung.endsWith("reverse");
  const haupt = umgekehrt ? "← Hauptachse (main axis)" : "Hauptachse (main axis) →";
  const quer = "Querachse (cross axis) →";
  // Bei writing-mode: vertical-rl zeigt „→“ nach unten und „←“ nach oben.
  oben.textContent = waagerecht ? haupt : quer;
  links.textContent = waagerecht ? quer : haupt;
  oben.className = `achse achse-oben ${waagerecht ? "ist-haupt" : "ist-quer"}`;
  links.className = `achse achse-links ${waagerecht ? "ist-quer" : "ist-haupt"}`;
}

function aktualisieren() {
  // Items neu erzeugen, wenn sich die Anzahl ändert
  const n = Number(anzahl.value);
  if (container.children.length !== n) {
    container.replaceChildren(
      ...Array.from({ length: n }, (_, k) => {
        const item = document.createElement("div");
        item.className = "i";
        item.textContent = k + 1;
        return item;
      })
    );
  }
  anzahl.nextElementSibling.value = n;
  gap.nextElementSibling.value = `${gap.value}px`;

  let css = "#sw-container {\n  display: flex;\n";
  for (const [eigenschaft, feld] of Object.entries(auswahl)) {
    container.style.setProperty(eigenschaft, feld.value);
    const hinweis = feld.value === standard[eigenschaft] ? "   /* Standard */" : "";
    css += `  ${eigenschaft}: ${feld.value};${hinweis}\n`;
  }
  container.style.gap = `${gap.value}px`;
  css += `  gap: ${gap.value}px;\n}`;
  ausgabe.textContent = css;
  achsenBeschriften(auswahl["flex-direction"].value);
}

[...Object.values(auswahl), gap, anzahl].forEach((el) => el.addEventListener("input", aktualisieren));
aktualisieren();
