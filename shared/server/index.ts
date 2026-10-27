// Service de diffusion du spike : état courant, rediffusion, latence et FPS.
// Contrat : specs/002-infra-commune/contracts/service.md
// Usage : node shared/server/index.ts [--vars <chemin.json>] [--port <n>]

import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { WebSocketServer, type WebSocket } from "ws";
import {
  OVERLAY_NAMES,
  SERVICE_HOST,
  SERVICE_PORT,
  normalize,
  parseMessage,
  validate,
  type OverlayName,
  type Role,
  type ServerMessage,
  type Values,
  type VariableDef,
} from "../protocol.ts";

const { values: args } = parseArgs({
  options: {
    vars: { type: "string", default: fileURLToPath(new URL("../variables.json", import.meta.url)) },
    port: { type: "string", default: String(SERVICE_PORT) },
  },
});

function fail(message: string): never {
  console.error(`[serveur] ${message}`);
  process.exit(1);
}

function loadVars(path: string): VariableDef[] {
  let defs: VariableDef[];
  try {
    defs = JSON.parse(readFileSync(resolve(path), "utf8"));
  } catch (err) {
    fail(`liste de variables illisible (${path}) : ${(err as Error).message}`);
  }
  if (!Array.isArray(defs) || defs.length === 0) fail(`liste de variables vide ou invalide : ${path}`);
  const ids = new Set<string>();
  for (const def of defs) {
    if (!/^[a-z][a-z0-9-]*$/.test(def.id) || ids.has(def.id)) fail(`identifiant invalide ou en double : ${def.id}`);
    if (!validate(def, def.default)) fail(`valeur par défaut invalide pour ${def.id} : ${JSON.stringify(def.default)}`);
    ids.add(def.id);
  }
  return defs;
}

const vars = loadVars(args.vars!);
const port = Number(args.port);
const defsById = new Map(vars.map((d) => [d.id, d]));
const state: Values = Object.fromEntries(vars.map((d) => [d.id, normalize(d, d.default)]));

interface ClientInfo {
  role?: Role;
  name?: OverlayName;
}

interface LatencySample {
  seq: number;
  id: string;
  overlay: OverlayName;
  ms: number;
}

let seq = 0;
let rejected = 0;
const clients = new Map<WebSocket, ClientInfo>();
const sent = new Map<number, { seq: number; id: string; at: number }>();
let latency: LatencySample[] = [];
let acked = new Set<string>();
let fps: { overlay: OverlayName; value: number; at: number }[] = [];

function reject(reason: string): void {
  rejected++;
  console.warn(`[serveur] message ignoré : ${reason}`);
}

function broadcast(message: ServerMessage): void {
  const text = JSON.stringify(message);
  for (const ws of clients.keys()) {
    if (ws.readyState === ws.OPEN) ws.send(text);
  }
}

function isOverlay(name: unknown): name is OverlayName {
  return OVERLAY_NAMES.includes(name as OverlayName);
}

function handle(ws: WebSocket, info: ClientInfo, text: string): void {
  const msg = parseMessage(text);
  if (!msg) return reject("JSON invalide");
  switch (msg.type) {
    case "hello": {
      info.role = msg.role as Role;
      if (isOverlay(msg.name)) info.name = msg.name;
      const welcome: ServerMessage = { type: "welcome", vars, values: state };
      ws.send(JSON.stringify(welcome));
      return;
    }
    case "set": {
      const def = defsById.get(String(msg.id));
      if (!def) return reject(`variable inconnue : ${String(msg.id)}`);
      if (!validate(def, msg.value)) return reject(`valeur invalide pour ${def.id} : ${JSON.stringify(msg.value)}`);
      const value = normalize(def, msg.value as Values[string]);
      state[def.id] = value;
      seq++;
      sent.set(seq, { seq, id: def.id, at: performance.now() });
      broadcast({ type: "update", seq, id: def.id, value });
      return;
    }
    case "alert": {
      seq++;
      broadcast({ type: "alert", seq });
      return;
    }
    case "ack": {
      const at = performance.now();
      const origin = sent.get(Number(msg.seq));
      if (!origin || !isOverlay(msg.overlay)) return;
      const key = `${origin.seq}:${msg.overlay}`;
      if (acked.has(key)) return;
      acked.add(key);
      latency.push({ seq: origin.seq, id: origin.id, overlay: msg.overlay, ms: at - origin.at });
      return;
    }
    case "fps": {
      if (isOverlay(msg.overlay) && typeof msg.value === "number") {
        fps.push({ overlay: msg.overlay, value: msg.value, at: performance.now() });
      }
      return;
    }
    default:
      reject(`type inconnu : ${msg.type}`);
  }
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function route(req: IncomingMessage, res: ServerResponse): void {
  const path = (req.url ?? "/").split("?")[0];
  if (req.method === "GET" && path === "/health") {
    return json(res, 200, { ok: true, seq, clients: [...clients.values()].map((c) => ({ role: c.role, name: c.name })) });
  }
  if (req.method === "GET" && path === "/stats") {
    return json(res, 200, { latency, fps, sent: [...sent.values()], rejected });
  }
  if (req.method === "POST" && path === "/stats/reset") {
    latency = [];
    acked = new Set();
    fps = [];
    sent.clear();
    rejected = 0;
    res.writeHead(204).end();
    return;
  }
  json(res, 404, { error: "route inconnue" });
}

const http = createServer(route);
const wss = new WebSocketServer({ server: http });

wss.on("connection", (ws) => {
  const info: ClientInfo = {};
  clients.set(ws, info);
  ws.on("message", (data) => handle(ws, info, data.toString()));
  ws.on("close", () => clients.delete(ws));
  ws.on("error", () => clients.delete(ws));
});

// ws réémet les erreurs du serveur HTTP sur le WebSocketServer : même traitement des deux côtés.
const onListenError = (err: NodeJS.ErrnoException): void => {
  if (err.code === "EADDRINUSE") fail(`le port ${port} est déjà occupé (un autre service tourne-t-il ?)`);
  fail(err.message);
};
http.on("error", onListenError);
wss.on("error", onListenError);

http.listen(port, SERVICE_HOST, () => {
  console.log(`PRET ${port}`);
});

function shutdown(): void {
  for (const ws of clients.keys()) ws.terminate();
  wss.close();
  http.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 500).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
