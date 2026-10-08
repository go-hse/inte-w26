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
  code.textContent = einruecken(beispiel.innerHTML);
  pre.className = "quelltext";
  pre.append(code);
  beispiel.after(pre);
});

// 2. Jedes div/span bekommt eine Beschriftung wie "div#kontakt.hinweis".
//    Die CSS-Regel [data-label]::before zeigt sie in der Strukturansicht an.
function beschriftung(element) {
  let text = element.tagName.toLowerCase();
  if (element.id) text += "#" + element.id;
  for (const klasse of element.classList) text += "." + klasse;
  return text;
}

beispiele.forEach((beispiel) => {
  beispiel.querySelectorAll("div, span").forEach((element) => {
    element.dataset.label = beschriftung(element);
  });
});

// 3. Strukturansicht ein-/ausschalten
const schalter = document.getElementById("struktur-schalter");
schalter.addEventListener("change", () => {
  document.body.classList.toggle("struktur", schalter.checked);
});

// 4. Selektoren ausprobieren: Treffer markieren und zählen
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
    treffer.textContent = `${elemente.length} Treffer für querySelectorAll("${selektor}")`;
  });
});

// 5. Eine id ist eindeutig: getElementById liefert genau ein Element
const kontakt = document.getElementById("kontakt");
document.getElementById("id-pruefung").textContent =
  `document.getElementById("kontakt") liefert genau ein Element: ` +
  `<${kontakt.tagName.toLowerCase()}> mit dem Text „${kontakt.textContent.trim()}“.`;
