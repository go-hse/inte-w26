"use strict";

// 1. Unter jedem Beispiel die zugehörigen Regeln aus <style id="beispiel-regeln"> anzeigen –
//    im Originalwortlaut, inklusive Kommentaren. data-regeln enthält die Selektoren, getrennt durch "|".
//    Anders als in den anderen Demos werden geschweifte Klammern gezählt, damit auch
//    @keyframes, @property und @media mit ihren inneren Blöcken vollständig angezeigt werden.
const quelle = document.getElementById("beispiel-regeln").textContent;

function maskieren(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function regelText(selektor) {
  // Selektor am Zeilenanfang; danach muss Leerraum, „{“ oder „,“ folgen (sonst passt „#knopf“ auch auf „#knopf:hover“)
  const muster = new RegExp(`^[ \\t]*${maskieren(selektor)}(?=[\\s{,])`, "m");
  const treffer = muster.exec(quelle);
  if (!treffer) return "";
  let tiefe = 0;
  let ende = quelle.indexOf("{", treffer.index);
  for (; ende < quelle.length; ende++) {
    if (quelle[ende] === "{") tiefe++;
    if (quelle[ende] === "}" && --tiefe === 0) break;
  }
  const zeilen = quelle.slice(treffer.index, ende + 1).split("\n");
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

const $ = (id) => document.getElementById(id);
function anzeigen(regler, einheit = "") {
  regler.nextElementSibling.value = `${regler.value}${einheit}`;
}

// 2. Spielwiese: Verlauf aus Typ, Winkel/Form/Zentrum und drei Farbstopps zusammensetzen
const g = {
  typ: $("g-typ"), wiederholen: $("g-wiederholen"), winkel: $("g-winkel"),
  form: $("g-form"), x: $("g-x"), y: $("g-y"),
};
const stoppFarben = [...document.querySelectorAll('[data-stopp="farbe"]')];
const stoppPos = [...document.querySelectorAll('[data-stopp="pos"]')];

function verlaufAktualisieren() {
  const typ = g.typ.value;
  const wdh = g.wiederholen.checked;
  // Bei repeating-Verläufen beschreiben die Stopps eine Kachel: Pixel bzw. Grad statt Prozent
  const einheit = wdh ? (typ === "conic" ? "deg" : "px") : "%";
  document.querySelectorAll("[data-fuer]").forEach((el) => {
    el.hidden = !el.dataset.fuer.split(" ").includes(typ);
  });
  $("g-winkel-name").textContent = typ === "conic" ? "from" : "Winkel";
  anzeigen(g.winkel, "deg");
  anzeigen(g.x, "%");
  anzeigen(g.y, "%");
  stoppPos.forEach((r) => anzeigen(r, einheit));

  const anfang = {
    linear: `${g.winkel.value}deg`,
    radial: `${g.form.value} at ${g.x.value}% ${g.y.value}%`,
    conic: `from ${g.winkel.value}deg at ${g.x.value}% ${g.y.value}%`,
  }[typ];
  const stopps = stoppFarben.map((f, k) => `${f.value} ${stoppPos[k].value}${einheit}`);
  const wert = `${wdh ? "repeating-" : ""}${typ}-gradient(\n    ${[anfang, ...stopps].join(",\n    ")}\n  )`;
  $("g-vorschau").style.background = wert.replace(/\s+/g, " ");
  $("g-css").textContent = `.vorschau {\n  background: ${wert};\n}`;

  const p = stoppPos.map((r) => Number(r.value));
  $("g-tipp").textContent = p[0] === p[1] || p[1] === p[2]
    ? "Zwei Stopps an derselben Position: An dieser Stelle entsteht eine harte Kante statt eines Verlaufs."
    : wdh
      ? `repeating: Die Stopps beschreiben eine Kachel von ${p[2]}${einheit}, die sich wiederholt.`
      : "Tipp: Schieben Sie zwei Stopps auf dieselbe Position – dann entsteht eine harte Kante.";
}
[...Object.values(g), ...stoppFarben, ...stoppPos].forEach((el) => el.addEventListener("input", verlaufAktualisieren));
verlaufAktualisieren();

// 3. Schatten-Werkzeug
const s = ["x", "y", "blur", "spread", "alpha"].map((n) => $(`s-${n}`));
function schattenAktualisieren() {
  const [x, y, blur, spread, alpha] = s.map((r) => Number(r.value));
  s.forEach((r, k) => anzeigen(r, k === 4 ? "%" : "px"));
  const wert = `${$("s-inset").checked ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px rgba(0, 0, 0, ${alpha / 100})`;
  $("s-karte").style.boxShadow = wert;
  $("s-css").textContent = `.karte {\n  box-shadow: ${wert};\n}\n/* x  y  blur  spread  Farbe */`;
}
[...s, $("s-inset")].forEach((el) => el.addEventListener("input", schattenAktualisieren));
schattenAktualisieren();

// 4. Rennen der Timing-Funktionen
$("rennen-start").addEventListener("click", () => $("rennen").classList.toggle("los"));

// 5. Alle fünf Animationen anhalten
$("anhalten").addEventListener("change", (e) => $("figuren").classList.toggle("angehalten", e.target.checked));

// 6. Teile der animation-Kurzschreibweise ausprobieren
const a = ["name", "dauer", "timing", "anzahl", "richtung", "fill"].map((n) => $(`a-${n}`));
const figur = $("a-figur");
function animationAktualisieren() {
  const [name, dauer, timing, anzahl, richtung, fill] = a.map((el) => el.value);
  anzeigen($("a-dauer"), "s");
  const wert = `${name} ${dauer}s ${timing} ${anzahl} ${richtung} ${fill}`;
  // Animation kurz entfernen und neu setzen, damit sie von vorn beginnt
  figur.style.animation = "none";
  void figur.offsetWidth;
  figur.style.animation = wert;
  $("a-css").textContent =
    `.figur {\n  animation: ${wert};\n}\n/* = animation-name, -duration, -timing-function,\n     -iteration-count, -direction, -fill-mode */`;
  $("a-tipp").textContent = anzahl === "infinite"
    ? "Bei infinite endet die Animation nie – fill-mode spielt dann keine Rolle. Wählen Sie 1 oder 3, um ihn zu sehen."
    : fill === "forwards" || fill === "both"
      ? "fill-mode forwards: Nach dem letzten Durchlauf bleibt die Figur im Zustand des letzten Keyframes stehen."
      : "fill-mode none: Nach dem letzten Durchlauf springt die Figur in ihren Ausgangszustand zurück.";
}
a.forEach((el) => el.addEventListener("input", animationAktualisieren));
$("a-neu").addEventListener("click", animationAktualisieren);
animationAktualisieren();

// 7. Status für Scroll-Driven Animations und reduzierte Bewegung
const scrollDriven = CSS.supports("animation-timeline: scroll()");
$("scroll-status").textContent = scrollDriven
  ? "Ihr Browser unterstützt Scroll-Driven Animations: Balken und Karten laufen rein mit CSS."
  : "Ihr Browser unterstützt Scroll-Driven Animations noch nicht. Den Balken führt hier deshalb JavaScript nach, " +
    "die Karten erscheinen ohne Einblenden.";

// JavaScript-Fallback für den Lesefortschritt – nur, wenn CSS es nicht kann.
// Fortschritt = gescrollte Strecke / maximal mögliche Scrollstrecke (0 … 1).
if (!scrollDriven) {
  const balken = $("lesefortschritt");
  const nachfuehren = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    balken.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  window.addEventListener("scroll", nachfuehren, { passive: true });
  window.addEventListener("resize", nachfuehren);
  nachfuehren();
}

const systemReduziert = window.matchMedia("(prefers-reduced-motion: reduce)");
function bewegungStatus() {
  $("bewegung-status").textContent = systemReduziert.matches
    ? "In Ihrem System ist „Bewegung reduzieren“ eingeschaltet – die Animationen dieser Seite stehen deshalb still."
    : "In Ihrem System ist „Bewegung reduzieren“ ausgeschaltet. Schalten Sie oben die Simulation ein und schauen Sie sich Abschnitt 8 an.";
}
systemReduziert.addEventListener("change", bewegungStatus);
bewegungStatus();
$("bewegung-aus").addEventListener("change", (e) => {
  document.body.classList.toggle("bewegung-aus", e.target.checked);
  animationAktualisieren();
});
