/*
 * Hochschule Esslingen – Internet-Technologien
 * Canvas-Beispiele zur 2D-API
 *
 * Grundlage: MDN Canvas Tutorial (https://developer.mozilla.org/de/docs/Web/API/Canvas_API/Tutorial)
 *
 * Aufbau:
 *   - Jedes Beispiel ist ein Objekt { title, api, draw(ctx, t) }.
 *   - draw() zeichnet immer in einem eigenen Koordinatensystem von SIZE x SIZE (150 x 150).
 *     Verschieben, Skalieren und Zuschneiden auf die Kachel übernimmt render().
 *   - Die Canvas-Größe folgt der Fensterbreite und berücksichtigt devicePixelRatio (HiDPI).
 */
"use strict";

const SIZE = 150;      // logisches Koordinatensystem jedes Beispiels
const GAP = 16;        // Abstand zwischen den Kacheln (CSS-Pixel)
const LABEL_H = 38;    // Platz für die Beschriftung unter einer Kachel
const MIN_TILE = 170;  // Kachelgröße (CSS-Pixel): mindestens ...
const MAX_TILE = 240;  // ... und höchstens

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const info = document.getElementById("info");

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

// Bild laden. Solange es nicht (fehlerfrei) geladen ist, zeigen die Bild-Beispiele einen Hinweis,
// denn drawImage() mit einem defekten Bild würde eine Exception werfen.
const img = new Image();
img.src = "img/logo.png";
const imageReady = () => img.complete && img.naturalWidth > 0;

function hint(c, text) {
  c.fillStyle = "#b6163d";
  c.font = "11px sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, SIZE / 2, SIZE / 2, SIZE - 10);
}

// Separate Zeichenfläche, die nicht im Dokument steht: OffscreenCanvas, falls vorhanden,
// sonst ein nicht eingehängtes <canvas>-Element.
function makeLayer(width, height) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return c;
}

// Fünfzackiger Stern mit Außenradius r um den aktuellen Ursprung
function drawStar(c, r) {
  const inner = r * 0.382;
  c.beginPath();
  for (let k = 0; k < 10; k++) {
    const radius = k % 2 === 0 ? r : inner;
    const angle = -Math.PI / 2 + (k * Math.PI) / 5;
    c.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
  }
  c.closePath();
  c.fill();
}

// Sternpositionen einmal festlegen, damit die Sterne nicht bei jedem Frame springen
const stars = Array.from({ length: 50 }, () => ({
  x: Math.random() * SIZE,
  y: Math.random() * SIZE,
  r: 2 + Math.random() * 4,
}));

// Compositing: jede Operation auf einer eigenen Ebene, damit sie nur dort wirkt
const compositeOps = ["source-over", "source-in", "source-out",
                      "destination-over", "destination-out", "xor"];
let compositeLayers = null;
function getCompositeLayers() {
  if (compositeLayers) return compositeLayers;
  compositeLayers = compositeOps.map((op) => {
    const layer = makeLayer(200, 200);   // 4-fache Auflösung für 50 x 50 Einheiten
    const c = layer.getContext("2d");
    c.scale(4, 4);
    c.fillStyle = "#00aadc";             // Ziel (destination): Quadrat
    c.fillRect(5, 5, 26, 26);
    c.globalCompositeOperation = op;
    c.fillStyle = "#b6163d";             // Quelle (source): Kreis
    c.beginPath();
    c.arc(30, 30, 15, 0, Math.PI * 2);
    c.fill();
    return layer;
  });
  return compositeLayers;
}

// Pixelmanipulation: Muster auf einer Ebene zeichnen, Pixel lesen, rechte Hälfte invertieren
let pixelLayer = null;
function getPixelLayer() {
  if (pixelLayer) return pixelLayer;
  const n = 2 * SIZE;                    // doppelte Auflösung
  pixelLayer = makeLayer(n, n);
  const c = pixelLayer.getContext("2d");
  const grad = c.createLinearGradient(0, 0, 0, n);
  grad.addColorStop(0, "#00aadc");
  grad.addColorStop(0.5, "#ffdd00");
  grad.addColorStop(1, "#b6163d");
  c.fillStyle = grad;
  c.fillRect(0, 0, n, n);
  c.fillStyle = "#193058";
  c.font = "bold 70px sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("Pixel", n / 2, n / 2);

  const data = c.getImageData(n / 2, 0, n / 2, n);   // nur die rechte Hälfte
  const px = data.data;                              // RGBA, je 1 Byte pro Kanal
  for (let k = 0; k < px.length; k += 4) {
    px[k] = 255 - px[k];         // Rot
    px[k + 1] = 255 - px[k + 1]; // Grün
    px[k + 2] = 255 - px[k + 2]; // Blau (Alpha bleibt)
  }
  c.putImageData(data, n / 2, 0);
  return pixelLayer;
}

// ---------------------------------------------------------------------------
// Die Beispiele
// ---------------------------------------------------------------------------

const examples = [
  {
    title: "Rechtecke",
    api: "fillRect, clearRect, strokeRect",
    draw(c) {
      c.fillStyle = "#193058";
      c.fillRect(15, 15, 120, 120);   // gefülltes Rechteck
      c.clearRect(40, 40, 70, 70);    // Bereich löschen (wird transparent)
      c.strokeRect(55, 55, 40, 40);   // nur Umriss
    },
  },
  {
    title: "Farbwechsel",
    api: "fillStyle (hsl), Zeit t",
    draw(c, t) {
      const step = Math.floor(t / 1000);          // neue Farbe jede Sekunde
      c.fillStyle = `hsl(${(step * 137.5) % 360}, 70%, 50%)`;
      c.fillRect(25, 25, 100, 100);
    },
  },
  {
    title: "Text ausrichten",
    api: "fillText, textAlign, measureText",
    draw(c) {
      c.strokeStyle = "#00aadc";                  // Hilfslinie bei x = 75
      c.beginPath();
      c.moveTo(75, 5);
      c.lineTo(75, 110);
      c.stroke();
      c.fillStyle = "#193058";
      c.font = "16px sans-serif";
      c.textBaseline = "middle";
      ["left", "center", "right"].forEach((align, k) => {
        c.textAlign = align;
        c.fillText(align, 75, 25 + k * 35);
      });
      const text = "measureText";
      const width = c.measureText(text).width;    // Breite des Textes in Einheiten
      c.textAlign = "left";
      c.fillText(text, 10, 130);
      c.strokeStyle = "#b6163d";
      c.strokeRect(10, 120, width, 20);
    },
  },
  {
    title: "Pfade: Smiley",
    api: "beginPath, arc, moveTo, stroke",
    draw(c) {
      c.lineWidth = 2;
      c.beginPath();
      c.arc(75, 75, 50, 0, Math.PI * 2);          // Gesicht
      c.moveTo(110, 75);                          // Stift anheben, sonst entsteht eine Verbindungslinie
      c.arc(75, 75, 35, 0, Math.PI);              // Mund (im Uhrzeigersinn)
      c.moveTo(65, 65);
      c.arc(60, 65, 5, 0, Math.PI * 2);           // linkes Auge
      c.moveTo(95, 65);
      c.arc(90, 65, 5, 0, Math.PI * 2);           // rechtes Auge
      c.stroke();
    },
  },
  {
    title: "Pfade: Dreiecke",
    api: "lineTo, fill, closePath, stroke",
    draw(c) {
      c.fillStyle = "#193058";
      c.beginPath();                              // gefüllt: Pfad wird automatisch geschlossen
      c.moveTo(25, 25);
      c.lineTo(105, 25);
      c.lineTo(25, 105);
      c.fill();
      c.lineWidth = 2;
      c.beginPath();                              // Umriss: closePath() für die dritte Kante nötig
      c.moveTo(125, 125);
      c.lineTo(125, 45);
      c.lineTo(45, 125);
      c.closePath();
      c.stroke();
    },
  },
  {
    title: "Kreisbögen",
    api: "arc(x, y, r, start, ende, gegenUhr)",
    draw(c) {
      c.fillStyle = "#193058";
      c.lineWidth = 2;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          c.beginPath();
          const endAngle = Math.PI + (Math.PI * col) / 2;  // 180°, 270°, 360°
          const counterClockwise = row % 2 === 1;
          c.arc(25 + col * 50, 22 + row * 36, 14, 0, endAngle, counterClockwise);
          if (row > 1) c.fill(); else c.stroke();          // obere Reihen Umriss, untere gefüllt
        }
      }
    },
  },
  {
    title: "Bézierkurven",
    api: "bezierCurveTo",
    draw(c) {
      c.fillStyle = "#b6163d";
      c.translate(0, 5);
      c.beginPath();
      c.moveTo(75, 40);
      c.bezierCurveTo(75, 37, 70, 25, 50, 25);
      c.bezierCurveTo(20, 25, 20, 62.5, 20, 62.5);
      c.bezierCurveTo(20, 80, 40, 102, 75, 120);
      c.bezierCurveTo(110, 102, 130, 80, 130, 62.5);
      c.bezierCurveTo(130, 62.5, 130, 25, 100, 25);
      c.bezierCurveTo(85, 25, 75, 37, 75, 40);
      c.fill();
    },
  },
  {
    title: "Quadratische Kurven",
    api: "quadraticCurveTo",
    draw(c) {
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(75, 25);
      c.quadraticCurveTo(25, 25, 25, 62.5);
      c.quadraticCurveTo(25, 100, 50, 100);
      c.quadraticCurveTo(50, 120, 30, 125);
      c.quadraticCurveTo(60, 120, 65, 100);
      c.quadraticCurveTo(125, 100, 125, 62.5);
      c.quadraticCurveTo(125, 25, 75, 25);
      c.stroke();
    },
  },
  {
    title: "Kombinierte Figur",
    api: "Pfade, Kurven, mehrere fill()",
    draw(c) {
      c.translate(75, 75);                        // Figur (um 97/102 entworfen) zentrieren
      c.scale(3.5, 3.5);                          // und vergrößern
      c.translate(-97, -102);
      c.fillStyle = "#b6163d";                    // Körper
      c.beginPath();
      c.moveTo(83, 116);
      c.lineTo(83, 102);
      c.bezierCurveTo(83, 94, 89, 88, 97, 88);
      c.bezierCurveTo(105, 88, 111, 94, 111, 102);
      c.lineTo(111, 116);
      c.lineTo(106.333, 111.333);
      c.lineTo(101.666, 116);
      c.lineTo(97, 111.333);
      c.lineTo(92.333, 116);
      c.lineTo(87.666, 111.333);
      c.lineTo(83, 116);
      c.fill();
      c.fillStyle = "white";                      // Augen
      c.beginPath();
      c.ellipse(91, 101, 4, 5, 0, 0, Math.PI * 2);
      c.ellipse(103, 101, 4, 5, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#193058";                    // Pupillen
      c.beginPath();
      c.arc(89, 102, 2, 0, Math.PI * 2);
      c.arc(101, 102, 2, 0, Math.PI * 2);
      c.fill();
    },
  },
  {
    title: "Bild skalieren",
    api: "drawImage(img, x, y, b, h)",
    draw(c) {
      if (!imageReady()) return hint(c, "Bild fehlt: img/logo.png");
      const ratio = img.naturalHeight / img.naturalWidth;
      let y = 10;
      for (const w of [130, 90, 50]) {            // gleiches Bild, drei Zielbreiten
        c.drawImage(img, 10, y, w, w * ratio);
        y += w * ratio + 12;
      }
    },
  },
  {
    title: "Bildausschnitt",
    api: "drawImage(img, sx, sy, sb, sh, x, y, b, h)",
    draw(c) {
      if (!imageReady()) return hint(c, "Bild fehlt: img/logo.png");
      const s = 130 / img.naturalWidth;           // ganzes Bild verkleinert ...
      c.drawImage(img, 10, 15, 130, img.naturalHeight * s);
      c.strokeStyle = "#00aadc";                  // ... mit markiertem Quellbereich
      c.strokeRect(10 + 11 * s, 15 + 3 * s, 121 * s, 28 * s);
      c.drawImage(img, 11, 3, 121, 28, 10, 80, 130, 30);   // Ausschnitt vergrößert
    },
  },
  {
    title: "Füllfarben",
    api: "fillStyle = rgb(...)",
    draw(c) {
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
          c.fillStyle = `rgb(${Math.floor(255 - 42.5 * row)}, ${Math.floor(255 - 42.5 * col)}, 0)`;
          c.fillRect(col * 25, row * 25, 25, 25);
        }
      }
    },
  },
  {
    title: "Linienfarben",
    api: "strokeStyle = rgb(...)",
    draw(c) {
      c.lineWidth = 2;
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
          c.strokeStyle = `rgb(0, ${Math.floor(255 - 42.5 * row)}, ${Math.floor(255 - 42.5 * col)})`;
          c.beginPath();
          c.arc(12.5 + col * 25, 12.5 + row * 25, 10, 0, Math.PI * 2);
          c.stroke();
        }
      }
    },
  },
  {
    title: "Transparenz: globalAlpha",
    api: "globalAlpha = 0.2",
    draw(c) {
      [["#FD0", 0, 0], ["#6C0", 75, 0], ["#09F", 0, 75], ["#F30", 75, 75]].forEach(([col, x, y]) => {
        c.fillStyle = col;
        c.fillRect(x, y, 75, 75);
      });
      c.fillStyle = "#FFF";
      c.globalAlpha = 0.2;                        // gilt für alles, was danach gezeichnet wird
      for (let k = 0; k < 7; k++) {
        c.beginPath();
        c.arc(75, 75, 10 + 10 * k, 0, Math.PI * 2);
        c.fill();
      }
    },
  },
  {
    title: "Transparenz: rgba",
    api: "fillStyle = rgba(r, g, b, a)",
    draw(c) {
      ["rgb(255,221,0)", "rgb(102,204,0)", "rgb(0,153,255)", "rgb(255,51,0)"].forEach((col, k) => {
        c.fillStyle = col;
        c.fillRect(0, k * 37.5, 150, 37.5);
      });
      for (let k = 0; k < 10; k++) {
        c.fillStyle = `rgba(255, 255, 255, ${(k + 1) / 10})`;   // Alpha nur für diese Farbe
        for (let row = 0; row < 4; row++) {
          c.fillRect(5 + k * 14, 5 + row * 37.5, 14, 27.5);
        }
      }
    },
  },
  {
    title: "Linienbreite",
    api: "lineWidth",
    draw(c) {
      for (let k = 0; k < 10; k++) {
        c.lineWidth = 1 + k;
        c.beginPath();
        c.moveTo(5 + k * 14, 10);
        c.lineTo(5 + k * 14, 140);
        c.stroke();
      }
    },
  },
  {
    title: "Linienenden",
    api: "lineCap: butt, round, square",
    draw(c) {
      c.strokeStyle = "#09f";                     // Hilfslinien
      c.beginPath();
      c.moveTo(10, 20);
      c.lineTo(140, 20);
      c.moveTo(10, 130);
      c.lineTo(140, 130);
      c.stroke();
      c.strokeStyle = "#193058";
      c.lineWidth = 15;
      ["butt", "round", "square"].forEach((cap, k) => {
        c.lineCap = cap;
        c.beginPath();
        c.moveTo(25 + k * 50, 20);
        c.lineTo(25 + k * 50, 130);
        c.stroke();
      });
    },
  },
  {
    title: "Linienverbindungen",
    api: "lineJoin: round, bevel, miter",
    draw(c) {
      c.strokeStyle = "#193058";
      c.lineWidth = 10;
      ["round", "bevel", "miter"].forEach((join, k) => {
        c.lineJoin = join;
        c.beginPath();
        c.moveTo(-5, 15 + k * 40);
        c.lineTo(35, 55 + k * 40);
        c.lineTo(75, 15 + k * 40);
        c.lineTo(115, 55 + k * 40);
        c.lineTo(155, 15 + k * 40);
        c.stroke();
      });
    },
  },
  {
    title: "Linearer Farbverlauf",
    api: "createLinearGradient, addColorStop",
    draw(c) {
      const fill = c.createLinearGradient(0, 0, 0, 150);
      fill.addColorStop(0, "#00ABEB");
      fill.addColorStop(0.5, "#fff");
      fill.addColorStop(0.5, "#26C000");          // gleiche Position: harte Kante
      fill.addColorStop(1, "#fff");
      const stroke = c.createLinearGradient(0, 50, 0, 95);
      stroke.addColorStop(0.5, "#000");
      stroke.addColorStop(1, "rgba(0, 0, 0, 0)");
      c.fillStyle = fill;                         // Verläufe als Füll- und Linienstil
      c.strokeStyle = stroke;
      c.lineWidth = 2;
      c.fillRect(10, 10, 130, 130);
      c.strokeRect(50, 50, 50, 50);
    },
  },
  {
    title: "Radialer Farbverlauf",
    api: "createRadialGradient",
    draw(c) {
      const gradients = [
        [0, 150, 50, 0, 140, 90, "#F4F201", "#E4C700", "rgba(228,199,0,0)", 0.8],
        [95, 15, 15, 102, 20, 40, "#00C9FF", "#00B5E2", "rgba(0,201,255,0)", 0.8],
        [105, 105, 20, 112, 120, 50, "#FF5F98", "#FF0188", "rgba(255,1,136,0)", 0.75],
        [45, 45, 10, 52, 50, 30, "#A7D30C", "#019F62", "rgba(1,159,98,0)", 0.9],
      ];
      for (const [x0, y0, r0, x1, y1, r1, a, b, z, stop] of gradients) {
        const g = c.createRadialGradient(x0, y0, r0, x1, y1, r1);
        g.addColorStop(0, a);
        g.addColorStop(stop, b);
        g.addColorStop(1, z);
        c.fillStyle = g;
        c.fillRect(0, 0, 150, 150);
      }
    },
  },
  {
    title: "Schatten",
    api: "shadowOffsetX/Y, shadowBlur, shadowColor",
    draw(c) {
      c.shadowOffsetX = 4;
      c.shadowOffsetY = 4;
      c.shadowBlur = 6;
      c.shadowColor = "rgba(0, 0, 0, 0.5)";
      c.fillStyle = "#00aadc";
      c.fillRect(25, 20, 100, 60);
      c.fillStyle = "#193058";
      c.font = "bold 22px sans-serif";
      c.textAlign = "center";
      c.fillText("Schatten", 75, 120);
    },
  },
  {
    title: "Compositing",
    api: "globalCompositeOperation",
    draw(c) {
      const layers = getCompositeLayers();
      c.fillStyle = "#193058";
      c.font = "8px sans-serif";
      c.textAlign = "center";
      layers.forEach((layer, k) => {
        const x = (k % 3) * 50;
        const y = Math.floor(k / 3) * 75;
        c.drawImage(layer, x, y + 5, 50, 50);     // Ebene in die Kachel übernehmen
        c.fillText(compositeOps[k], x + 25, y + 66, 48);
      });
    },
  },
  {
    title: "Clipping",
    api: "clip(), save/restore",
    draw(c) {
      c.beginPath();
      c.arc(75, 75, 60, 0, Math.PI * 2);
      c.clip();                                   // ab jetzt nur noch im Kreis zeichnen
      const bg = c.createLinearGradient(0, 0, 0, 150);
      bg.addColorStop(0, "#232256");
      bg.addColorStop(1, "#143778");
      c.fillStyle = bg;
      c.fillRect(0, 0, 150, 150);
      c.fillStyle = "#fff";
      for (const s of stars) {
        c.save();
        c.translate(s.x, s.y);
        drawStar(c, s.r);
        c.restore();
      }
    },
  },
  {
    title: "Transformation + Animation",
    api: "translate, rotate, scale, requestAnimationFrame",
    draw(c, t) {
      c.translate(75, 75);                        // Ursprung in die Mitte
      c.save();
      c.rotate(t / 1000);                         // eine Umdrehung in ca. 6,3 s
      c.fillStyle = "#193058";
      c.fillRect(-40, -40, 80, 80);
      c.restore();
      const s = 0.75 + 0.25 * Math.sin(t / 300);  // pulsierende Größe
      c.rotate(-t / 500);
      c.scale(s, s);
      c.fillStyle = "#00aadc";
      c.fillRect(-20, -20, 40, 40);
    },
  },
  {
    title: "Pixelmanipulation",
    api: "getImageData, putImageData",
    draw(c) {
      c.drawImage(getPixelLayer(), 0, 0, SIZE, SIZE);
      c.fillStyle = "#fff";
      c.font = "10px sans-serif";
      c.fillText("Original", 6, 14);
      c.textAlign = "right";
      c.fillText("invertiert", 144, 14);
    },
  },
];

// ---------------------------------------------------------------------------
// Raster: Größe, Position der Kacheln, Zeichnen
// ---------------------------------------------------------------------------

const grid = { cols: 1, tile: MIN_TILE, offsetX: GAP, width: 0, height: 0, dpr: 1 };
let hovered = -1;

function layout() {
  grid.dpr = window.devicePixelRatio || 1;
  grid.width = canvas.clientWidth;                // CSS-Breite (100 % laut Stylesheet)
  grid.cols = Math.max(1, Math.floor((grid.width - GAP) / (MIN_TILE + GAP)));
  grid.tile = Math.min(MAX_TILE, (grid.width - GAP * (grid.cols + 1)) / grid.cols);
  const used = grid.cols * grid.tile + (grid.cols - 1) * GAP;
  grid.offsetX = (grid.width - used) / 2;         // Raster zentrieren
  const rows = Math.ceil(examples.length / grid.cols);
  grid.height = GAP + rows * (grid.tile + LABEL_H + GAP);

  // HiDPI: Pixelpuffer um devicePixelRatio größer als die CSS-Anzeigegröße
  canvas.style.height = grid.height + "px";
  canvas.width = Math.round(grid.width * grid.dpr);
  canvas.height = Math.round(grid.height * grid.dpr);
}

function tilePosition(index) {
  return {
    x: grid.offsetX + (index % grid.cols) * (grid.tile + GAP),
    y: GAP + Math.floor(index / grid.cols) * (grid.tile + LABEL_H + GAP),
  };
}

// Jedes Beispiel startet mit denselben Standardwerten
function resetStyle(c) {
  c.fillStyle = "#000";
  c.strokeStyle = "#000";
  c.lineWidth = 1;
  c.lineCap = "butt";
  c.lineJoin = "miter";
  c.globalAlpha = 1;
  c.font = "10px sans-serif";
  c.textAlign = "start";
  c.textBaseline = "alphabetic";
}

function render(t) {
  // Zeichenbefehle in CSS-Pixeln, Ausgabe in Gerätepixeln
  ctx.setTransform(grid.dpr, 0, 0, grid.dpr, 0, 0);
  ctx.clearRect(0, 0, grid.width, grid.height);

  examples.forEach((example, index) => {
    const { x, y } = tilePosition(index);
    const scale = grid.tile / SIZE;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, grid.tile, grid.tile);

    ctx.save();                                   // Beispiel isolieren:
    ctx.beginPath();
    ctx.rect(0, 0, grid.tile, grid.tile);
    ctx.clip();                                   // nichts außerhalb der Kachel
    ctx.scale(scale, scale);                      // 150 x 150 Einheiten -> Kachelgröße
    resetStyle(ctx);
    try {
      example.draw(ctx, t);
    } catch (err) {                               // ein fehlerhaftes Beispiel stoppt nicht alle
      console.error(example.title, err);
    }
    ctx.restore();                                // alle Zustände des Beispiels zurücksetzen

    const active = index === hovered;
    ctx.lineWidth = active ? 3 : 1;
    ctx.strokeStyle = active ? "#b6163d" : "#c8c8c8";
    ctx.strokeRect(0.5, 0.5, grid.tile - 1, grid.tile - 1);

    ctx.textBaseline = "top";
    ctx.fillStyle = "#193058";
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillText(`${index + 1}. ${example.title}`, 0, grid.tile + 5, grid.tile);
    ctx.fillStyle = "#555";
    ctx.font = "11px ui-monospace, Consolas, monospace";
    ctx.fillText(example.api, 0, grid.tile + 22, grid.tile);
    ctx.restore();
  });
}

// ---------------------------------------------------------------------------
// Ereignisse
// ---------------------------------------------------------------------------

// Mausposition -> Kachel. Das Canvas selbst kennt keine Objekte (anders als SVG).
function tileAt(px, py) {
  for (let index = 0; index < examples.length; index++) {
    const { x, y } = tilePosition(index);
    if (px >= x && px <= x + grid.tile && py >= y && py <= y + grid.tile + LABEL_H) return index;
  }
  return -1;
}

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const index = tileAt(event.clientX - rect.left, event.clientY - rect.top);
  if (index !== hovered) {
    hovered = index;
    info.textContent = index < 0 ? "" : `Nr. ${index + 1}: ${examples[index].title} – ${examples[index].api}`;
    render(performance.now());
  }
});

canvas.addEventListener("pointerleave", () => {
  hovered = -1;
  info.textContent = "";
  render(performance.now());
});

window.addEventListener("resize", () => {
  layout();
  render(performance.now());
});

img.addEventListener("load", () => render(performance.now()));
img.addEventListener("error", () => console.warn("Bild nicht gefunden:", img.src));

// Animation mit requestAnimationFrame (synchron zur Bildwiederholrate, pausiert in Hintergrund-Tabs).
// Bei "Bewegung reduzieren" im Betriebssystem bleibt das Bild statisch.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function frame(t) {
  render(t);
  if (!reducedMotion.matches) requestAnimationFrame(frame);
}

reducedMotion.addEventListener("change", () => requestAnimationFrame(frame));

layout();
requestAnimationFrame(frame);
