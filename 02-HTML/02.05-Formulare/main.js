"use strict";

const formular = document.getElementById("formular");
const beispiele = formular.querySelectorAll(".beispiel");

// 1. Quelltext jedes Beispiels anzeigen (vor Schritt 2, damit die Etiketten nicht darin auftauchen)
function einruecken(text) {
  const zeilen = text.replace(/^\s*\n|\n\s*$/g, "").split("\n");
  const einzug = Math.min(...zeilen.filter((z) => z.trim()).map((z) => z.match(/^ */)[0].length));
  return zeilen.map((z) => z.slice(einzug)).join("\n");
}

beispiele.forEach((beispiel) => {
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  // innerHTML schreibt boolesche Attribute als checked="" – für die Anzeige kürzen
  code.textContent = einruecken(beispiel.innerHTML)
    .replace(/ (checked|selected|required|readonly|disabled)=""/g, " $1");
  pre.className = "quelltext";
  pre.append(code);
  beispiel.after(pre);
});

// 2. Etikett hinter jedem Feld: Element/Typ, name, label – Probleme rot
function teil(klasse, text) {
  const span = document.createElement("span");
  span.className = klasse;
  span.textContent = text;
  return span;
}

beispiele.forEach((beispiel) => {
  beispiel.querySelectorAll("input, select, textarea, button").forEach((feld) => {
    const etikett = document.createElement("span");
    etikett.className = "etikett";
    etikett.setAttribute("aria-hidden", "true");

    const typ = feld.getAttribute("type");
    etikett.append(teil("element", feld.tagName.toLowerCase() + (typ ? `[type=${typ}]` : "")));

    if (feld.tagName !== "BUTTON") {
      if (feld.name) etikett.append(teil("name", `name="${feld.name}"`));
      else etikett.append(teil("fehlt", "kein name → wird nicht gesendet"));

      if (typ !== "hidden") {
        if (feld.labels.length) etikett.append(teil("label", "label ✓"));
        else etikett.append(teil("fehlt", "kein label"));
      }
    }
    for (const attr of ["required", "pattern", "minlength", "min", "max", "readonly", "disabled"]) {
      if (feld.hasAttribute(attr)) {
        const wert = feld.getAttribute(attr);
        etikett.append(teil(attr === "disabled" ? "fehlt" : "info", wert ? `${attr}="${wert}"` : attr));
      }
    }
    if (typ === "hidden") etikett.append(teil("info", `value="${feld.value}" (unsichtbar)`));

    // Bei Radio/Checkbox das Etikett hinter das label setzen, sonst direkt hinter das Feld
    const ziel = (typ === "radio" || typ === "checkbox") && feld.labels.length ? feld.labels[0] : feld;
    ziel.after(etikett);
  });
});

// 3. Hover/Fokus auf ein Feld hebt das verknüpfte label hervor
formular.querySelectorAll("input, select, textarea").forEach((feld) => {
  const markieren = (an) => {
    [feld, ...(feld.labels || [])].forEach((el) => el.classList.toggle("verknuepft", an));
  };
  feld.addEventListener("mouseenter", () => markieren(true));
  feld.addEventListener("mouseleave", () => markieren(false));
  (feld.labels || []).forEach((label) => {
    label.addEventListener("mouseenter", () => markieren(true));
    label.addEventListener("mouseleave", () => markieren(false));
  });
});

// 4. Validierungsstatus unter den Feldern aus Abschnitt 4
const pruefFelder = formular.querySelectorAll(".pruefen");
pruefFelder.forEach((feld) => {
  const status = document.createElement("output");
  status.className = "status";
  status.htmlFor = feld.id;
  feld.parentElement.insertBefore(status, feld.nextElementSibling.nextSibling);  // hinter dem Etikett
  feld.status = status;
});

function statusAktualisieren() {
  pruefFelder.forEach((feld) => {
    const v = feld.validity;
    const probleme = ["valueMissing", "typeMismatch", "patternMismatch", "tooShort",
                      "rangeUnderflow", "rangeOverflow"].filter((k) => v[k]);
    feld.status.className = "status " + (v.valid ? "ok" : "fehler");
    feld.status.textContent = v.valid
      ? "validity.valid = true"
      : `${probleme.join(", ")}: ${feld.validationMessage}`;
  });
}

// 5. Live-Anzeige: was würde der Browser senden?
const anfrage = document.getElementById("anfrage");
const rumpf = document.getElementById("rumpf");
const daten = document.getElementById("daten");
const absendeStatus = document.getElementById("absende-status");
const warnung = document.getElementById("warnung");

function ausgabeAktualisieren() {
  // FormData wendet dieselben Regeln an wie der Browser beim Absenden:
  // nur Felder mit name, keine disabled-Felder, nur angehakte Checkboxen/Radios
  const formData = new FormData(formular);
  const kodiert = new URLSearchParams(formData).toString();
  const methode = formular.method.toUpperCase();

  if (methode === "GET") {
    anfrage.textContent = `GET ${formular.getAttribute("action")}?${kodiert}`;
    rumpf.hidden = true;
  } else {
    anfrage.textContent = `POST ${formular.getAttribute("action")}\n` +
                          "Content-Type: application/x-www-form-urlencoded";
    rumpf.hidden = false;
    rumpf.textContent = kodiert;
  }

  // Sensible Daten in der URL?
  const passwort = formData.get("passwort");
  warnung.hidden = !(methode === "GET" && passwort);

  daten.replaceChildren();
  for (const [name, wert] of formData) {
    const zeile = daten.insertRow();
    zeile.insertCell().textContent = name;
    zeile.insertCell().textContent = wert;
  }
  statusAktualisieren();
}

formular.addEventListener("input", ausgabeAktualisieren);
formular.addEventListener("change", ausgabeAktualisieren);
formular.addEventListener("reset", () => {
  setTimeout(ausgabeAktualisieren);           // erst nach dem Zurücksetzen auslesen
  absendeStatus.textContent = "";
});

// Absenden wird nur simuliert. Das submit-Ereignis kommt erst, wenn alle Felder gültig sind
// (oder die Browser-Validierung abgeschaltet ist).
formular.addEventListener("submit", (event) => {
  event.preventDefault();
  absendeStatus.className = "ok";
  absendeStatus.textContent = `Abgesendet um ${new Date().toLocaleTimeString("de-DE")} (simuliert).`;
  // validity lesen löst – anders als checkValidity() – keine invalid-Ereignisse aus
  const alleGueltig = [...formular.elements].every((el) => !el.willValidate || el.validity.valid);
  if (!alleGueltig) {
    absendeStatus.className = "fehler";
    absendeStatus.textContent += " Ohne Browser-Validierung kommen auch ungültige Daten an – " +
                                 "der Server muss deshalb immer selbst prüfen.";
  }
});

// Ungültige Felder melden sich mit dem Ereignis "invalid", wenn das Absenden blockiert wird
let blockiert = 0;
formular.addEventListener("invalid", () => {
  if (blockiert++ === 0) {
    setTimeout(() => {                         // nach allen invalid-Ereignissen auswerten
      absendeStatus.className = "fehler";
      absendeStatus.textContent = `Absenden blockiert: ${blockiert} ungültige(s) Feld(er).`;
      blockiert = 0;
    });
  }
}, true);

// Werkzeugleiste
document.getElementById("struktur-schalter").addEventListener("change", (event) => {
  document.body.classList.toggle("struktur", event.target.checked);
});
document.getElementById("validierung-schalter").addEventListener("change", (event) => {
  formular.noValidate = !event.target.checked;   // entspricht dem Attribut novalidate
  absendeStatus.textContent = "";
});
document.querySelectorAll('input[name="methode-wahl"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    formular.method = radio.value;
    ausgabeAktualisieren();
  });
});

ausgabeAktualisieren();
