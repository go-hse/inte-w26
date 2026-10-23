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

// 2. Elemente mit data-messen bekommen ihre gemessene Größe als data-mass (Anzeige per ::after).
//    offsetWidth/offsetHeight = content + padding + border.
function messen() {
  document.querySelectorAll("[data-messen]").forEach((el) => {
    const hoch = el.parentElement.classList.contains("mass-rechts");
    el.dataset.mass = hoch ? `${el.offsetWidth} × ${el.offsetHeight}` : `${el.offsetWidth}px`;
  });
}

// 3. Spielwiese: grow, shrink und basis für drei Items setzen und die Verteilung nachrechnen –
//    so, wie der Browser es macht (vereinfachter Algorithmus aus der Flexbox-Spezifikation).
const container = document.getElementById("sw-container");
const items = [...container.children];
const breite = document.getElementById("sw-breite");
const gap = document.getElementById("sw-gap");
const felder = [...document.querySelectorAll(".sw-items fieldset")];
const namen = ["A", "B", "C"];

function werteLesen() {
  return felder.map((fs) => {
    const wert = (f) => Number(fs.querySelector(`[data-feld="${f}"]`).value);
    return { grow: wert("grow"), shrink: wert("shrink"), basis: wert("basis") };
  });
}

function verteilen(werte, innen, abstand) {
  const zeilen = [];
  const summeBasis = werte.reduce((s, w) => s + w.basis, 0);
  const frei = innen - summeBasis - abstand * (werte.length - 1);
  zeilen.push(`Summe der Basis = ${werte.map((w) => w.basis).join(" + ")} = ${summeBasis}px`);
  zeilen.push(`freier Platz    = ${innen} − ${summeBasis} − ${werte.length - 1}·${abstand} (gap) = ${frei}px`);

  if (frei >= 0) {
    const summeGrow = werte.reduce((s, w) => s + w.grow, 0);
    if (summeGrow === 0) {
      zeilen.push("alle flex-grow = 0 → niemand wächst, der Platz bleibt frei");
      return { zeilen, groessen: werte.map((w) => w.basis) };
    }
    // Ist die Summe < 1, wird nur dieser Anteil des freien Platzes verteilt.
    const teiler = Math.max(summeGrow, 1);
    zeilen.push(`positiv → Verteilung nach flex-grow (Summe ${summeGrow}):`);
    const groessen = werte.map((w, k) => {
      const anteil = (frei * w.grow) / teiler;
      zeilen.push(`  ${namen[k]}: ${w.basis} + ${frei}·${w.grow}/${teiler} = ${runden(w.basis + anteil)}px`);
      return w.basis + anteil;
    });
    return { zeilen, groessen };
  }

  // Negativer Platz: Schrumpfen im Verhältnis shrink × basis. Items, die unter 0 fallen würden,
  // werden bei 0 „eingefroren“, danach wird der Rest unter den übrigen neu verteilt.
  zeilen.push("negativ → Schrumpfen nach flex-shrink × flex-basis:");
  const groessen = werte.map((w) => w.basis);
  const eingefroren = werte.map((w) => w.shrink === 0 || w.basis === 0);
  for (let runde = 0; runde < werte.length; runde++) {
    const offen = werte.map((_, k) => k).filter((k) => !eingefroren[k]);
    if (offen.length === 0) break;
    const fehlt = innen - abstand * (werte.length - 1) - groessen.reduce((s, g) => s + g, 0);
    const summeFaktor = offen.reduce((s, k) => s + werte[k].shrink * werte[k].basis, 0);
    let verletzt = false;
    offen.forEach((k) => {
      const ziel = groessen[k] + (fehlt * werte[k].shrink * werte[k].basis) / summeFaktor;
      if (ziel < 0) { groessen[k] = 0; eingefroren[k] = true; verletzt = true; }
    });
    if (!verletzt) {
      offen.forEach((k) => {
        const faktor = werte[k].shrink * werte[k].basis;
        const anteil = (fehlt * faktor) / summeFaktor;
        zeilen.push(`  ${namen[k]}: ${groessen[k]} − ${-fehlt}·${faktor}/${summeFaktor} = ${runden(groessen[k] + anteil)}px`);
        groessen[k] += anteil;
      });
      break;
    }
    zeilen.push("  (ein Item würde unter 0px fallen → bleibt bei 0px, Rest neu verteilen)");
  }
  werte.forEach((w, k) => {
    if (w.shrink === 0) zeilen.push(`  ${namen[k]}: flex-shrink 0 → bleibt ${w.basis}px`);
    else if (eingefroren[k] && groessen[k] === 0) zeilen.push(`  ${namen[k]}: auf 0px geschrumpft`);
  });
  if (groessen.reduce((s, g) => s + g, 0) + abstand * (werte.length - 1) > innen + 0.5) {
    zeilen.push("  → die Items passen trotzdem nicht: sie ragen über den Container hinaus");
  }
  return { zeilen, groessen };
}

function runden(x) {
  return Math.round(x * 10) / 10;
}

function aktualisieren() {
  const werte = werteLesen();
  felder.forEach((fs) => fs.querySelectorAll("input").forEach((r) => {
    r.nextElementSibling.value = r.dataset.feld === "basis" ? `${r.value}px` : r.value;
  }));
  breite.nextElementSibling.value = `${breite.value}px`;
  gap.nextElementSibling.value = `${gap.value}px`;

  container.style.width = `${breite.value}px`;
  container.style.gap = `${gap.value}px`;
  items.forEach((item, k) => {
    item.style.flex = `${werte[k].grow} ${werte[k].shrink} ${werte[k].basis}px`;
  });

  document.getElementById("sw-css").textContent =
    `#sw-container {\n  display: flex;\n  width: ${breite.value}px;\n  gap: ${gap.value}px;\n}\n` +
    items.map((_, k) => `.item-${namen[k].toLowerCase()} {\n  flex: ${werte[k].grow} ${werte[k].shrink} ${werte[k].basis}px;\n}`).join("\n");

  const { zeilen } = verteilen(werte, Number(breite.value), Number(gap.value));
  zeilen.push("", `gemessen im Browser: ${items.map((it, k) => `${namen[k]} = ${runden(it.getBoundingClientRect().width)}px`).join(", ")}`);
  document.getElementById("sw-rechnung").textContent = zeilen.join("\n");
  items.forEach((it) => (it.dataset.mass = `${runden(it.getBoundingClientRect().width)}px`));
  messen();
}

[breite, gap, ...felder.flatMap((fs) => [...fs.querySelectorAll("input")])].forEach((el) =>
  el.addEventListener("input", aktualisieren)
);
aktualisieren();
window.addEventListener("resize", messen);
