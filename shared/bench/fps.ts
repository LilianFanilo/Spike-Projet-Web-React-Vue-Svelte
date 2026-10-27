// FPS de l'overlay 3D, remontés par le compteur partagé (?debug=1).
// Usage : npm run fps -- --framework react [--duration 60] [--obs-fps 30]

import { HTTP_URL } from "../protocol.ts";
import { option, record, type Framework } from "./record.ts";

const framework = option("framework") as Framework;
const duration = Number(option("duration", "60"));
const obsFps = process.argv.includes("--obs-fps") ? Number(option("obs-fps")) : undefined;

const health = await (await fetch(`${HTTP_URL}/health`)).json();
if (!health.clients.some((c: { name?: string }) => c.name === "overlay-3d")) {
  console.error("overlay-3d n'est pas connecté : ouvrir overlay-3d.html?debug=1 (scène FPS d'OBS) avant la mesure.");
  process.exit(1);
}

await fetch(`${HTTP_URL}/stats/reset`, { method: "POST" });
console.log(`Relevé des FPS pendant ${duration} s…`);
await new Promise((r) => setTimeout(r, duration * 1000));

const stats = await (await fetch(`${HTTP_URL}/stats`)).json();
const valeurs: number[] = stats.fps.filter((f: { overlay: string }) => f.overlay === "overlay-3d").map((f: { value: number }) => f.value).slice(1);
if (valeurs.length < duration / 2) {
  console.error(`Seulement ${valeurs.length} échantillons FPS : la page est-elle ouverte avec ?debug=1 et visible ?`);
  process.exit(1);
}

const min = Math.min(...valeurs);
const moyen = Number((valeurs.reduce((s, v) => s + v, 0) / valeurs.length).toFixed(1));
const details = { plafond: obsFps, ratio: obsFps ? Number((min / obsFps).toFixed(3)) : undefined, echantillons: valeurs.length };
record({ framework, mesure: "fps-min", valeur: min, unite: "fps", conditions: { obsFps }, details });
record({ framework, mesure: "fps-moyen", valeur: moyen, unite: "fps", conditions: { obsFps }, details });
console.log(`FPS min ${min}, moyen ${moyen}${obsFps ? `, ratio min/plafond ${details.ratio}` : ""}`);
