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

// 2. Schalter der Steuerung: Klassen an <html> und <body> setzen, die eine Regel abschalten
//    oder den Modus wechseln. Die zugehörigen Regeln stehen in <style id="beispiel-regeln">.
const body = document.body;
const html = document.documentElement;
const schalter = {
  abstand: document.getElementById("s-abstand"),
  scrollPadding: document.getElementById("s-scroll-padding"),
  zIndex: document.getElementById("s-z-index"),
};

function schalten() {
  const modus = document.querySelector('input[name="modus"]:checked').value;
  body.classList.toggle("als-sticky", modus === "sticky");
  body.classList.toggle("als-static", modus === "static");
  body.classList.toggle("ohne-abstand", !schalter.abstand.checked);
  html.classList.toggle("ohne-scroll-padding", !schalter.scrollPadding.checked);
  body.classList.toggle("ohne-z-index", !schalter.zIndex.checked);
  // Abstand und z-index sind nur bei fixed sinnvoll
  schalter.abstand.disabled = modus !== "fixed";
  schalter.zIndex.disabled = modus !== "fixed";
}
document.querySelectorAll(".steuerung input").forEach((el) => el.addEventListener("change", schalten));
schalten();

// 3. Höhe von Kopf und Fuß messen und in --kopf / --fuss schreiben.
//    Bricht die Leiste bei schmalem Fenster um, stimmt der freigehaltene Platz trotzdem.
const kopf = document.querySelector(".kopf");
const fuss = document.querySelector(".fuss");
const messung = document.getElementById("messung");

const beobachter = new ResizeObserver(() => {
  const k = Math.ceil(kopf.getBoundingClientRect().height);
  const f = Math.ceil(fuss.getBoundingClientRect().height);
  html.style.setProperty("--kopf", `${k}px`);
  html.style.setProperty("--fuss", `${f}px`);
  messung.textContent = `gemessen: --kopf: ${k}px;  --fuss: ${f}px;  (Fensterbreite ${window.innerWidth}px)`;
});
beobachter.observe(kopf);
beobachter.observe(fuss);

// 4. Den Abschnitt, der gerade unter der Leiste beginnt, in der Navigation hervorheben
const links = [...document.querySelectorAll(".kopf ul a")];
const abschnitte = links.map((a) => document.querySelector(a.hash));
function aktivSetzen() {
  const grenze = kopf.getBoundingClientRect().bottom + 40;
  let aktiv = null;
  abschnitte.forEach((s, k) => {
    if (s.getBoundingClientRect().top <= grenze) aktiv = k;
  });
  links.forEach((a, k) => a.classList.toggle("aktiv", k === aktiv));
}
window.addEventListener("scroll", aktivSetzen, { passive: true });
aktivSetzen();

// 5. Auf schmalen Bildschirmen startet die Steuerung zugeklappt, damit sie keinen Inhalt verdeckt
if (window.matchMedia("(max-width: 600px)").matches) {
  document.querySelector(".steuerung details").open = false;
}

// 6. Abschnitt 7: position-area des Tooltips wählen, Fallback ein-/ausschalten, Regel anzeigen
const tipp = document.getElementById("tipp");
const tippArea = document.getElementById("tipp-area");
const tippFallback = document.getElementById("tipp-fallback");
function tippAktualisieren() {
  tipp.style.positionArea = tippArea.value;
  tipp.classList.toggle("mit-fallback", tippFallback.checked);
  document.getElementById("tipp-css").textContent =
    `#tipp {\n  position-anchor: --tipp;\n  position-area: ${tippArea.value};\n` +
    (tippFallback.checked ? "  position-try-fallbacks: flip-block, flip-inline;\n" : "") + "}";
}
tippArea.addEventListener("input", tippAktualisieren);
tippFallback.addEventListener("change", tippAktualisieren);
tippAktualisieren();

// Hinweis, falls der Browser Anchor Positioning nicht kennt
if (!CSS.supports("anchor-name: --test")) {
  document.getElementById("anker-hinweis").hidden = false;
}

// Menü schließen, sobald ein Eintrag gewählt wurde
document.querySelectorAll("#mehr-menue a").forEach((a) =>
  a.addEventListener("click", () => document.getElementById("mehr-menue").hidePopover())
);
