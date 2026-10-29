// Animation d'alerte 2D (FR-023, research R7) : attachment qui rejoue l'animation à chaque nouvelle alerte.

import { ALERT_DURATION_MS } from "@shared/protocol.ts";
import type { Attachment } from "svelte/attachments";

const KEYFRAMES: Keyframe[] = [
  { transform: "scale(1)", filter: "brightness(1)", offset: 0 },
  { transform: "scale(1.15)", filter: "brightness(2.5)", offset: 0.3 },
  { transform: "scale(1)", filter: "brightness(1)", offset: 1 },
];

/** Un nouveau numéro crée une nouvelle attachment : Svelte annule la précédente et l'animation repart du début. */
export function rejouer(numero: number): Attachment<HTMLElement> {
  return (element) => {
    if (numero === 0) return;
    const animation = element.animate(KEYFRAMES, { duration: ALERT_DURATION_MS, easing: "ease-out" });
    return () => animation.cancel();
  };
}
