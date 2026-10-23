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

// 2. Elemente mit data-messen bekommen ein Kästchen mit ihrer gemessenen Größe (border-box).
//    offsetWidth/offsetHeight = content + padding + border, ohne margin.
function messen() {
  document.querySelectorAll("[data-messen]").forEach((el) => {
    let marke = el.nextElementSibling;
    if (!marke || !marke.classList.contains("mass")) {
      marke = document.createElement("span");
      marke.className = "mass";
      el.after(marke);
    }
    marke.textContent = `${el.offsetWidth} × ${el.offsetHeight}`;
  });
}

// 3. Spielwiese: width, padding, border, margin und box-sizing live setzen,
//    Schema wie in den Entwicklerwerkzeugen und Rechnung für die Gesamtbreite anzeigen.
const box = document.getElementById("sw-box");
const regler = ["width", "padding", "border", "margin"].map((n) => document.getElementById(`sw-${n}`));
const borderBox = document.getElementById("sw-border-box");
const ausgabe = document.getElementById("sw-css");

function aktualisieren() {
  const [w, p, b, m] = regler.map((r) => Number(r.value));
  regler.forEach((r) => (r.nextElementSibling.value = `${r.value}px`));

  box.style.boxSizing = borderBox.checked ? "border-box" : "content-box";
  box.style.width = `${w}px`;
  box.style.padding = `${p}px`;
  box.style.borderWidth = `${b}px`;
  box.style.margin = `${m}px`;

  const inhalt = borderBox.checked ? Math.max(w - 2 * p - 2 * b, 0) : w;
  const sichtbar = inhalt + 2 * p + 2 * b;
  document.getElementById("s-m").textContent = m;
  document.getElementById("s-b").textContent = b;
  document.getElementById("s-p").textContent = p;
  document.getElementById("s-c").textContent = `${inhalt} × ${box.clientHeight - 2 * p}`;

  const rechnung = borderBox.checked
    ? `/* border-box: width enthält padding und border\n   Inhalt   = ${w} − 2·${p} − 2·${b} = ${inhalt}px */`
    : `/* content-box: padding und border kommen zur width dazu */`;
  ausgabe.textContent =
    `#sw-box {\n  box-sizing: ${box.style.boxSizing};\n  width: ${w}px;\n  padding: ${p}px;\n` +
    `  border: ${b}px solid;\n  margin: ${m}px;\n}\n\n${rechnung}\n` +
    `/* sichtbar  = ${inhalt} + 2·${p} + 2·${b} = ${sichtbar}px\n` +
    `   mit margin: ${sichtbar} + 2·${m} = ${sichtbar + 2 * m}px Platzbedarf */`;
  messen();
}

[...regler, borderBox].forEach((el) => el.addEventListener("input", aktualisieren));
aktualisieren();
window.addEventListener("resize", messen);

// 4. Abschnitt 7: clear: both am zweiten Absatz ein- und ausschalten
const clearDemo = document.getElementById("clear-demo");
document.getElementById("clear-schalter").addEventListener("change", (e) => {
  clearDemo.classList.toggle("mit-clear", e.target.checked);
});
