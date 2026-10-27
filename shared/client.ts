// Client WebSocket partagé (research R3) : présentation, reconnexion, sonde de latence, compteur FPS.
// Contrat : specs/002-infra-commune/contracts/protocole.md — le même transport pour les trois frameworks.

import { startFps } from "./fps.ts";
import { createProbe, type Probe } from "./probe.ts";
import {
  WS_URL,
  parseMessage,
  type ClientMessage,
  type OverlayName,
  type VariableDef,
  type VarValue,
  type Values,
} from "./protocol.ts";

const RECONNECT_MS = 1000;

export interface ConnectOptions {
  role: "dashboard" | "overlay";
  /** Obligatoire pour un overlay : active la sonde de latence et, avec ?debug=1, le compteur FPS. */
  name?: OverlayName;
  /** true par défaut : nouvelle tentative toutes les secondes. */
  reconnect?: boolean;
  onWelcome(vars: VariableDef[], values: Values): void;
  onUpdate(id: string, value: VarValue, seq: number): void;
  onAlert(seq: number): void;
  onStatus(connected: boolean): void;
}

export interface Connection {
  set(id: string, value: VarValue): void;
  alert(): void;
  close(): void;
}

export function connect(options: ConnectOptions): Connection {
  const reconnect = options.reconnect ?? true;
  let socket: WebSocket | null = null;
  let connected = false;
  let closed = false;
  let defs = new Map<string, VariableDef>();
  let probe: Probe | null = null;
  let fpsStarted = false;

  const send = (msg: ClientMessage): void => {
    if (connected && socket) socket.send(JSON.stringify(msg));
  };

  if (options.name) {
    probe = createProbe(options.name, send);
  }

  const setStatus = (value: boolean): void => {
    if (connected === value) return;
    connected = value;
    options.onStatus(value);
  };

  const open = (): void => {
    if (closed) return;
    const ws = new WebSocket(WS_URL);
    socket = ws;
    ws.onopen = () => {
      setStatus(true);
      send({ type: "hello", role: options.role, name: options.name });
      if (options.name && !fpsStarted && new URLSearchParams(location.search).get("debug") === "1") {
        fpsStarted = true;
        startFps(options.name, send);
      }
    };
    ws.onmessage = (event) => {
      const msg = parseMessage(String(event.data));
      if (!msg) return;
      if (msg.type === "welcome") {
        const vars = msg.vars as VariableDef[];
        defs = new Map(vars.map((d) => [d.id, d]));
        options.onWelcome(vars, msg.values as Values);
      } else if (msg.type === "update") {
        const id = String(msg.id);
        const value = msg.value as VarValue;
        const seq = Number(msg.seq);
        options.onUpdate(id, value, seq);
        const def = defs.get(id);
        if (probe && def) probe.track(seq, def, value);
      } else if (msg.type === "alert") {
        options.onAlert(Number(msg.seq));
      }
    };
    ws.onclose = () => {
      if (socket !== ws) return;
      socket = null;
      setStatus(false);
      if (reconnect && !closed) setTimeout(open, RECONNECT_MS);
    };
    ws.onerror = () => ws.close();
  };

  // Statut initial explicite : déconnecté tant que la première connexion n'a pas abouti.
  options.onStatus(false);
  open();

  return {
    set: (id, value) => send({ type: "set", id, value }),
    alert: () => send({ type: "alert" }),
    close: () => {
      closed = true;
      socket?.close();
    },
  };
}
