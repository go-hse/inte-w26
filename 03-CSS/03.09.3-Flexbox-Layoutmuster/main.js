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

// 2. Über jeder Bühne die aktuelle Breite anzeigen. Die Bühnen sind mit resize: horizontal
//    in der Breite veränderbar; ein ResizeObserver meldet jede Änderung.
const beobachter = new ResizeObserver((eintraege) => {
  for (const { target } of eintraege) {
    target.previousElementSibling.textContent =
      `Bühne: ${Math.round(target.getBoundingClientRect().width)}px breit – an der Ecke ↘ ziehen`;
  }
});
document.querySelectorAll(".buehne").forEach((buehne) => {
  const anzeige = document.createElement("p");
  anzeige.className = "breite-anzeige";
  buehne.before(anzeige);
  beobachter.observe(buehne);
});

// 3. Schalter: alle Flex-Container in den Beispielen und deren direkte Kinder markieren.
//    Ob ein Element ein Flex-Container ist, steht in seinem berechneten display-Wert.
function flexMarkieren() {
  document.querySelectorAll(".beispiel *").forEach((el) => {
    el.classList.toggle("ist-flex", getComputedStyle(el).display.includes("flex"));
    el.classList.toggle("ist-flex-item", getComputedStyle(el.parentElement).display.includes("flex"));
  });
}
document.getElementById("debug").addEventListener("change", (e) => {
  flexMarkieren();
  document.body.classList.toggle("debug", e.target.checked);
});

// 4. Abschnitt 4: Inhalt in beide Seiten einfügen bzw. wieder auf einen Absatz zurücksetzen
document.getElementById("mehr-text").addEventListener("click", () => {
  document.querySelectorAll(".muster-seite .inhalt").forEach((inhalt) => {
    const p = document.createElement("p");
    p.textContent = "Noch ein Absatz. Ist der Inhalt höher als die Mindesthöhe, wächst die Seite mit.";
    inhalt.append(p);
  });
});
document.getElementById("weniger-text").addEventListener("click", () => {
  document.querySelectorAll(".muster-seite .inhalt").forEach((inhalt) => {
    inhalt.replaceChildren(inhalt.firstElementChild);
  });
  seiteMessen();
});

// Regler: Mindesthöhe beider Seiten (simuliert die Fensterhöhe)
const seiten = [...document.querySelectorAll(".muster-seite")];
const hoehe = document.getElementById("seite-hoehe");
const status = document.getElementById("seite-status");

function seiteMessen() {
  hoehe.nextElementSibling.value = `${hoehe.value}rem`;
  seiten.forEach((s) => (s.style.minHeight = `${hoehe.value}rem`));
  // Freier Platz = Mindesthöhe minus Höhe von Kopfzeile, Inhalt und Footer (linke Seite, ohne Flexbox)
  const ohne = document.getElementById("seite-ohne");
  const belegt = [...ohne.children].reduce((summe, kind) => summe + kind.offsetHeight, 0);
  const frei = Math.round(ohne.clientHeight - belegt);
  status.textContent = frei > 0
    ? `Freier Platz: ${frei}px. Links liegt er als Lücke unter dem Footer, rechts bekommt ihn der Inhalt durch flex: 1.`
    : "Kein freier Platz: Der Inhalt ist höher als die Mindesthöhe. flex: 1 hat nichts zu verteilen, beide Seiten sehen gleich aus.";
}
hoehe.addEventListener("input", seiteMessen);
document.getElementById("mehr-text").addEventListener("click", seiteMessen);
seiteMessen();
