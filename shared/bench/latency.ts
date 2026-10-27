// Mesure de latence service → overlay peint (FR-041 de la feature 002).
// Préalable : overlay-a et overlay-b ouverts et visibles (OBS ou fenêtres au premier plan).
// Usage : npm run latence -- --framework react [--count 200] [--interval 100] [--obs-fps 30]

import { HTTP_URL, WS_URL, type OverlayName, type Values } from "../protocol.ts";
import { option, record, type Framework } from "./record.ts";

const framework = option("framework") as Framework;
const count = Number(option("count", "200"));
const interval = Number(option("interval", "100"));
const obsFps = process.argv.includes("--obs-fps") ? Number(option("obs-fps")) : undefined;
const PERTE_MAX = 0.02;

const ATTENDU: Record<string, OverlayName> = { titre: "overlay-a", score: "overlay-a", bandeau: "overlay-b" };

const health = await (await fetch(`${HTTP_URL}/health`)).json();
const connectes = new Set(health.clients.map((c: { name?: string }) => c.name));
for (const name of ["overlay-a", "overlay-b"]) {
  if (!connectes.has(name)) {
    console.error(`${name} n'est pas connecté au service : ouvrez les overlays (visibles) avant la mesure.`);
    process.exit(1);
  }
}

await fetch(`${HTTP_URL}/stats/reset`, { method: "POST" });

const ws = new WebSocket(WS_URL);
const values = await new Promise<Values>((resolve, reject) => {
  ws.onerror = () => reject(new Error("connexion au service impossible"));
  ws.onopen = () => ws.send(JSON.stringify({ type: "hello", role: "bench" }));
  ws.onmessage = (e) => {
    const msg = JSON.parse(String(e.data));
    if (msg.type === "welcome") resolve(msg.values);
  };
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let bandeau = values.bandeau === true;
let score = typeof values.score === "number" ? values.score : 0;

console.log(`Envoi de ${count} mises à jour toutes les ${interval} ms…`);
for (let n = 1; n <= count; n++) {
  const id = ["titre", "score", "bandeau"][n % 3];
  const value = id === "titre" ? `Mesure ${n}` : id === "score" ? (score = (score + 1) % 999999) : (bandeau = !bandeau);
  ws.send(JSON.stringify({ type: "set", id, value }));
  await sleep(interval);
}
await sleep(2500);
ws.close();

const stats = await (await fetch(`${HTTP_URL}/stats`)).json();
const sent: { seq: number; id: string }[] = stats.sent;
const latency: { seq: number; overlay: OverlayName; ms: number }[] = stats.latency;

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  return sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)];
}
const round = (n: number) => Number(n.toFixed(2));

const parOverlay: Record<string, { mediane: number; p95: number; recus: number; attendus: number; perte: number }> = {};
let attendusTotal = 0;
let recusTotal = 0;
const toutes: number[] = [];
for (const overlay of ["overlay-a", "overlay-b"] as const) {
  const attendus = sent.filter((s) => ATTENDU[s.id] === overlay).map((s) => s.seq);
  const ms = latency.filter((l) => l.overlay === overlay && attendus.includes(l.seq)).map((l) => l.ms).sort((a, b) => a - b);
  toutes.push(...ms);
  attendusTotal += attendus.length;
  recusTotal += ms.length;
  parOverlay[overlay] = {
    mediane: round(quantile(ms, 0.5)),
    p95: round(quantile(ms, 0.95)),
    recus: ms.length,
    attendus: attendus.length,
    perte: round(1 - ms.length / Math.max(1, attendus.length)),
  };
}
toutes.sort((a, b) => a - b);
const perte = 1 - recusTotal / Math.max(1, attendusTotal);
const valide = perte <= PERTE_MAX;
const conditions = { obsFps, count, interval };
const details = { parOverlay, perte: round(perte), echantillons: toutes.length };

const mediane = record({ framework, mesure: "latence-mediane", valeur: round(quantile(toutes, 0.5)), unite: "ms", valide, conditions, details });
const p95 = record({ framework, mesure: "latence-p95", valeur: round(quantile(toutes, 0.95)), unite: "ms", valide, conditions, details });

console.table(parOverlay);
console.log(`Médiane ${mediane.valeur} ms, p95 ${p95.valeur} ms, accusés perdus ${(perte * 100).toFixed(1)} %`);
if (obsFps) console.log(`Soit ${(mediane.valeur / (1000 / obsFps)).toFixed(2)} images (médiane) à ${obsFps} i/s`);
if (!valide) {
  console.error(`Mesure INVALIDE : plus de ${PERTE_MAX * 100} % d'accusés perdus (overlay masqué ou en arrière-plan ?)`);
  process.exit(2);
}
