// Sonde de latence partagée (research R4) : attend que la valeur soit dans le DOM,
// attend une image de plus pour qu'elle soit peinte, puis envoie l'accusé au service.
// Appelée par client.ts ; identique pour tous les frameworks.

import { serialize, type ClientMessage, type OverlayName, type VariableDef, type VarValue } from "./protocol.ts";

const TIMEOUT_MS = 2000;

export interface Probe {
  track(seq: number, def: VariableDef, value: VarValue): void;
}

export function createProbe(overlay: OverlayName, send: (msg: ClientMessage) => void): Probe {
  return {
    track(seq, def, value) {
      const selector = `[data-var="${def.id}"]`;
      if (!document.querySelector(selector)) return; // variable non affichée par cet overlay
      const expected = serialize(def.type, value);
      const start = performance.now();
      const check = (): void => {
        if (document.querySelector(selector)?.getAttribute("data-value") === expected) {
          requestAnimationFrame(() => send({ type: "ack", seq, overlay }));
          return;
        }
        if (performance.now() - start < TIMEOUT_MS) requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    },
  };
}
