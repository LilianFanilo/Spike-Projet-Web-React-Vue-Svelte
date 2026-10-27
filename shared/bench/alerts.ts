// Déclencheur d'alertes pour la mesure CPU (FR-044 de la feature 002). N'enregistre rien.
// Usage : npm run alertes -- [--count 10] [--interval 3000]

import { WS_URL } from "../protocol.ts";
import { option } from "./record.ts";

const count = Number(option("count", "10"));
const interval = Number(option("interval", "3000"));

const ws = new WebSocket(WS_URL);
await new Promise<void>((resolve, reject) => {
  ws.onopen = () => resolve();
  ws.onerror = () => reject(new Error("connexion au service impossible"));
});
ws.send(JSON.stringify({ type: "hello", role: "bench" }));

for (let n = 1; n <= count; n++) {
  ws.send(JSON.stringify({ type: "alert" }));
  console.log(`Alerte ${n}/${count}`);
  if (n < count) await new Promise((r) => setTimeout(r, interval));
}
await new Promise((r) => setTimeout(r, 2500)); // laisser finir la dernière animation
ws.close();
