// Fixtures communes de la suite d'acceptation : un service de diffusion neuf par test,
// un client de test WebSocket et la construction des URL de l'app testée.

import { test as base, expect } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { HTTP_URL, WS_URL, type OverlayName, type VarValue } from "../protocol.ts";

const SERVER = fileURLToPath(new URL("../server/index.ts", import.meta.url));
const VARS_DIR = fileURLToPath(new URL("../", import.meta.url));

export type Page = "dashboard" | OverlayName;

/** URL d'une page de l'app testée ; APP_QUERY (défauts du témoin) est ajouté à chaque URL. */
export function pageUrl(name: Page, extraQuery = ""): string {
  const app = process.env.APP_URL;
  if (!app) throw new Error("APP_URL manquant : adresse du build de production à tester (ex. http://localhost:4173)");
  const query = [process.env.APP_QUERY ?? "", extraQuery].filter(Boolean).join("&");
  return `${app.replace(/\/$/, "")}/${name}.html${query ? `?${query}` : ""}`;
}

export interface TestClient {
  messages: Record<string, any>[];
  set(id: string, value: VarValue): void;
  alert(): void;
  waitFor(predicate: (msg: Record<string, any>) => boolean, timeout?: number): Promise<Record<string, any>>;
  close(): void;
}

export interface Stats {
  latency: { seq: number; id: string; overlay: OverlayName; ms: number }[];
  fps: { overlay: OverlayName; value: number; at: number }[];
  sent: { seq: number; id: string; at: number }[];
  rejected: number;
}

export interface Serveur {
  start(opts?: { vars?: string }): Promise<void>;
  stop(): Promise<void>;
  restart(opts?: { vars?: string }): Promise<void>;
  client(): Promise<TestClient>;
  stats(): Promise<Stats>;
  health(): Promise<{ ok: boolean; seq: number; clients: { role?: string; name?: string }[] }>;
}

async function openClient(): Promise<TestClient> {
  const ws = new WebSocket(WS_URL);
  const messages: Record<string, any>[] = [];
  const waiters: { predicate: (m: Record<string, any>) => boolean; resolve: (m: Record<string, any>) => void }[] = [];
  ws.onmessage = (event) => {
    const msg = JSON.parse(String(event.data));
    messages.push(msg);
    for (const w of [...waiters]) {
      if (w.predicate(msg)) {
        waiters.splice(waiters.indexOf(w), 1);
        w.resolve(msg);
      }
    }
  };
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error("client de test : connexion au service impossible"));
  });
  ws.send(JSON.stringify({ type: "hello", role: "test" }));
  const send = (msg: unknown) => ws.send(JSON.stringify(msg));
  const client: TestClient = {
    messages,
    set: (id, value) => send({ type: "set", id, value }),
    alert: () => send({ type: "alert" }),
    waitFor(predicate, timeout = 3000) {
      const found = messages.find(predicate);
      if (found) return Promise.resolve(found);
      return new Promise((resolve, reject) => {
        const waiter = { predicate, resolve };
        waiters.push(waiter);
        setTimeout(() => {
          const i = waiters.indexOf(waiter);
          if (i >= 0) {
            waiters.splice(i, 1);
            reject(new Error(`client de test : message attendu non reçu en ${timeout} ms`));
          }
        }, timeout);
      });
    },
    close: () => ws.close(),
  };
  await client.waitFor((m) => m.type === "welcome");
  return client;
}

function createServeur(): Serveur & { dispose(): Promise<void> } {
  let child: ChildProcess | null = null;
  const clients: TestClient[] = [];

  const start = async (opts: { vars?: string } = {}): Promise<void> => {
    if (child) throw new Error("service déjà démarré");
    const args = [SERVER];
    if (opts.vars) args.push("--vars", VARS_DIR + opts.vars);
    const proc = spawn(process.execPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    child = proc;
    let stderr = "";
    proc.stderr!.on("data", (d) => (stderr += d));
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`service non prêt en 5 s\n${stderr}`)), 5000);
      proc.stdout!.on("data", (d: Buffer) => {
        if (d.toString().includes("PRET")) {
          clearTimeout(timer);
          resolve();
        }
      });
      proc.on("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`service arrêté au démarrage (code ${code})\n${stderr}`));
      });
    });
  };

  const stop = async (): Promise<void> => {
    const proc = child;
    if (!proc) return;
    child = null;
    for (const c of clients.splice(0)) c.close();
    if (proc.exitCode !== null) return;
    await new Promise<void>((resolve) => {
      proc.once("exit", () => resolve());
      proc.kill();
    });
  };

  return {
    start,
    stop,
    async restart(opts) {
      await stop();
      await start(opts);
    },
    async client() {
      const c = await openClient();
      clients.push(c);
      return c;
    },
    async stats() {
      return (await fetch(`${HTTP_URL}/stats`)).json();
    },
    async health() {
      return (await fetch(`${HTTP_URL}/health`)).json();
    },
    dispose: stop,
  };
}

export const test = base.extend<{ serveur: Serveur }>({
  serveur: [
    async ({}, use) => {
      const serveur = createServeur();
      await serveur.start();
      await use(serveur);
      await serveur.dispose();
    },
    { auto: true },
  ],
});

export { expect };

/** Attend qu'un attribut prenne une valeur et renvoie le temps écoulé depuis `since` (ms). */
export async function waitAttr(
  page: import("@playwright/test").Page,
  selector: string,
  attr: string,
  value: string,
  timeout: number,
  since: number,
): Promise<number> {
  await page.waitForFunction(
    ([s, a, v]) => document.querySelector(s)?.getAttribute(a) === v,
    [selector, attr, value] as const,
    { timeout, polling: 10 },
  );
  return Date.now() - since;
}
