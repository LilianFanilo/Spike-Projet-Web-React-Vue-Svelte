// Alerte (FR-023, FR-042) : data-alert pendant 2 s, animation relancée depuis le début à chaque alerte.
import { onUnmounted, ref, watch } from "vue";
import { ALERT_DURATION_MS } from "@shared/protocol.ts";
import { useLiveStore } from "./store.ts";

// Grossissement ×1,15 avec flash lumineux, puis retour (même rendu que le témoin).
const KEYFRAMES: Keyframe[] = [
  { transform: "scale(1)", filter: "brightness(1)" },
  { transform: "scale(1.15)", filter: "brightness(2.5)", offset: 0.3 },
  { transform: "scale(1)", filter: "brightness(1)" },
];

/**
 * `cibles` : éléments à animer en 2D (aucun pour la 3D, qui anime le modèle elle-même).
 * `debut` : horodatage performance.now() de la dernière alerte, null avant la première.
 */
export function useAlerte(cibles: () => (HTMLElement | null | undefined)[] = () => []) {
  const store = useLiveStore();
  const actif = ref(false);
  const debut = ref<number | null>(null);
  const animations: Animation[] = [];
  let minuteur: ReturnType<typeof setTimeout> | undefined;

  watch(
    () => store.alertes,
    () => {
      actif.value = true;
      debut.value = performance.now();
      for (const a of animations.splice(0)) a.cancel();
      for (const el of cibles()) {
        if (el) animations.push(el.animate(KEYFRAMES, { duration: ALERT_DURATION_MS, easing: "ease-out" }));
      }
      clearTimeout(minuteur);
      minuteur = setTimeout(() => (actif.value = false), ALERT_DURATION_MS);
    },
  );

  onUnmounted(() => clearTimeout(minuteur));

  return { actif, debut };
}
