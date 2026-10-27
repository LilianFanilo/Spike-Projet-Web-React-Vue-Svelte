// Compteur FPS partagé (research R5), actif seulement avec ?debug=1 (démarré par client.ts).
// Même méthode de comptage pour les trois frameworks : images requestAnimationFrame par seconde.

import type { ClientMessage, OverlayName } from "./protocol.ts";

export function startFps(overlay: OverlayName, send: (msg: ClientMessage) => void): () => void {
  const label = document.createElement("div");
  label.setAttribute("data-fps", "");
  label.style.cssText =
    "position:fixed;top:8px;left:8px;z-index:2147483647;padding:4px 8px;" +
    "font:600 20px/1 monospace;color:#fff;background:rgba(0,0,0,.6);border-radius:4px;pointer-events:none";
  label.textContent = "… fps";
  document.body.appendChild(label);

  let frames = 0;
  let windowStart = performance.now();
  let handle = 0;

  const tick = (now: number): void => {
    frames++;
    if (now - windowStart >= 1000) {
      const value = Math.round((frames * 1000) / (now - windowStart));
      label.textContent = `${value} fps`;
      send({ type: "fps", overlay, value });
      frames = 0;
      windowStart = now;
    }
    handle = requestAnimationFrame(tick);
  };
  handle = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(handle);
    label.remove();
  };
}
