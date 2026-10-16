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

// 2. Spielwiese: list-style-type, -position und -image live setzen und als CSS anzeigen.
const liste = document.getElementById("sw-liste");
const typ = document.getElementById("sw-typ");
const bild = document.getElementById("sw-bild");
const ausgabe = document.getElementById("sw-css");

function aktualisieren() {
  const position = document.querySelector('input[name="sw-pos"]:checked').value;
  liste.style.listStyleType = typ.value;
  liste.style.listStylePosition = position;
  liste.style.listStyleImage = bild.checked ? 'url("img/stern.svg")' : "none";

  const zeilen = [`  list-style-type: ${typ.value};`, `  list-style-position: ${position};`];
  if (bild.checked) zeilen.push('  list-style-image: url("img/stern.svg");');
  const kurz = [typ.value, position, bild.checked ? 'url("img/stern.svg")' : ""].join(" ").trim();
  ausgabe.textContent = `ul {\n${zeilen.join("\n")}\n}\n\n/* Kurzschreibweise */\nul { list-style: ${kurz}; }`;
}

document.querySelectorAll("#spielwiese select, #spielwiese input").forEach((el) =>
  el.addEventListener("input", aktualisieren));
aktualisieren();
