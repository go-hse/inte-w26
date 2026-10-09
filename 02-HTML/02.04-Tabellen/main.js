"use strict";

// Alle Beispiel-Bereiche. Ausgewertet werden nur die Tabellen darin.
const beispiele = document.querySelectorAll(".beispiel");

// 1. Quelltext jedes Beispiels unter dem Beispiel anzeigen
//    (vor Schritt 3, damit die Hilfsattribute nicht im Quelltext erscheinen)
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

// 2. Raster: Auf welcher Zeile und Spalte liegt jede Zelle?
//    So geht auch der Browser vor: Zellen werden von links nach rechts in die
//    nächste freie Spalte gelegt; rowspan/colspan belegen zusätzliche Plätze.
function raster(tabelle) {
  const belegt = [];                         // belegt[zeile][spalte] = Zelle
  const position = new Map();                // Zelle -> { zeile, spalte }
  [...tabelle.rows].forEach((tr, zeile) => {
    belegt[zeile] ??= [];
    let spalte = 0;
    for (const zelle of tr.cells) {
      while (belegt[zeile][spalte]) spalte++;  // von rowspan belegte Plätze überspringen
      position.set(zelle, { zeile, spalte });
      for (let z = 0; z < zelle.rowSpan; z++) {
        for (let s = 0; s < zelle.colSpan; s++) {
          (belegt[zeile + z] ??= [])[spalte + s] = zelle;
        }
      }
      spalte += zelle.colSpan;
    }
  });
  return { belegt, position };
}

// 3. Beschriftung jeder Zelle, z. B. "td[colspan=2] Z3/S2"
//    Die CSS-Regel [data-label]::before zeigt sie in der Strukturansicht an.
const rasterSchalter = document.getElementById("raster-schalter");

function beschriften() {
  beispiele.forEach((beispiel) => {
    beispiel.querySelectorAll("table").forEach((tabelle) => {
      const { position } = raster(tabelle);
      tabelle.querySelectorAll("th, td").forEach((zelle) => {
        let text = zelle.tagName.toLowerCase();
        for (const attr of ["scope", "colspan", "rowspan"]) {
          if (zelle.hasAttribute(attr)) text += `[${attr}=${zelle.getAttribute(attr)}]`;
        }
        if (rasterSchalter.checked) {
          const { zeile, spalte } = position.get(zelle);
          text += ` Z${zeile + 1}/S${spalte + 1}`;
        }
        zelle.dataset.label = text;
      });
      if (tabelle.caption) tabelle.caption.dataset.label = "caption";
    });
  });
}

// 4. Kopfzellen einer Datenzelle bestimmen – vereinfacht nach den Regeln, die auch
//    Screenreader nutzen: Spaltenköpfe (scope="col", thead oder eine reine th-Zeile)
//    in denselben Spalten, Zeilenköpfe (scope="row") in denselben Zeilen.
function richtung(th) {
  if (th.scope === "col" || th.scope === "colgroup") return "spalte";
  if (th.scope === "row" || th.scope === "rowgroup") return "zeile";
  const nurKopfzellen = [...th.parentElement.cells].every((zelle) => zelle.tagName === "TH");
  return th.closest("thead") || nurKopfzellen ? "spalte" : "zeile";
}

function kopfzellen(zelle) {
  const { belegt, position } = raster(zelle.closest("table"));
  const { zeile, spalte } = position.get(zelle);
  const kopf = new Set();
  belegt.forEach((reihe) => {
    for (let s = spalte; s < spalte + zelle.colSpan; s++) {
      const k = reihe[s];
      if (k && k.tagName === "TH" && richtung(k) === "spalte") kopf.add(k);
    }
  });
  for (let z = zeile; z < zeile + zelle.rowSpan; z++) {
    (belegt[z] || []).forEach((k) => {
      if (k && k.tagName === "TH" && richtung(k) === "zeile") kopf.add(k);
    });
  }
  return [...kopf];
}

const kopfAusgabe = document.getElementById("kopf");

document.addEventListener("mouseover", (event) => {
  const zelle = event.target.closest(".beispiel td");
  document.querySelectorAll(".kopf-markiert, .zelle-markiert").forEach((el) => {
    el.classList.remove("kopf-markiert", "zelle-markiert");
  });
  if (!zelle) return;
  const kopf = kopfzellen(zelle);
  zelle.classList.add("zelle-markiert");
  kopf.forEach((k) => k.classList.add("kopf-markiert"));
  kopfAusgabe.textContent = `„${zelle.textContent.trim()}“ → ` +
    (kopf.length ? kopf.map((k) => k.textContent.trim()).join(", ") : "keine Kopfzellen");
});

// 5. Summe im tfoot prüfen und Zeilen per insertRow() ergänzen
const ressourcen = document.getElementById("ressourcen");
const summePruefung = document.getElementById("summe-pruefung");

function summeDerZeilen() {
  let summe = 0;
  for (const tr of ressourcen.tBodies[0].rows) summe += Number(tr.cells[1].textContent);
  return summe;
}

function summePruefen() {
  const summe = summeDerZeilen();
  const fuss = Number(ressourcen.tFoot.rows[0].cells[1].textContent);
  const anzahl = ressourcen.tBodies[0].rows.length;
  summePruefung.className = summe === fuss ? "ok" : "fehler";
  summePruefung.textContent = summe === fuss
    ? `tFoot stimmt: Die ${anzahl} Zeilen in tBodies[0] ergeben zusammen ${summe} KB.`
    : `tFoot zeigt ${fuss} KB, die ${anzahl} Zeilen ergeben aber ${summe} KB.`;
}

document.getElementById("zeile-ergaenzen").addEventListener("click", () => {
  const datei = document.getElementById("neu-datei").value.trim() || "neue-datei";
  const groesse = Number(document.getElementById("neu-groesse").value) || 0;

  const tr = ressourcen.tBodies[0].insertRow();   // neue Zeile am Ende des tbody
  const th = document.createElement("th");        // insertCell() kann nur td
  th.scope = "row";
  th.textContent = datei;
  tr.append(th);
  tr.insertCell().textContent = groesse;

  ressourcen.tFoot.rows[0].cells[1].textContent = summeDerZeilen();
  beschriften();
  summePruefen();
});

// 6. Werkzeugleiste
document.getElementById("struktur-schalter").addEventListener("change", (event) => {
  document.body.classList.toggle("struktur", event.target.checked);
});
rasterSchalter.addEventListener("change", beschriften);

beschriften();
summePruefen();
