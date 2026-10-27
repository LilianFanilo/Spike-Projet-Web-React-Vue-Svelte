import { ALERT_DURATION_MS } from "@shared/protocol.ts";
import { defaut } from "./defauts.ts";

let minuteur: ReturnType<typeof setTimeout> | undefined;

/** Joue (ou relance depuis le début) l'animation d'alerte et tient data-alert à jour sur la racine. */
export function jouerAlerte(racine: HTMLElement, cibles: HTMLElement[], pendant?: (actif: boolean) => void): void {
  if (defaut("alerte")) return;
  racine.dataset.alert = "on";
  pendant?.(true);
  for (const cible of cibles) {
    cible.classList.remove("alerte");
    void cible.offsetWidth; // force le recalcul pour relancer l'animation CSS
    cible.classList.add("alerte");
  }
  clearTimeout(minuteur);
  minuteur = setTimeout(() => {
    racine.dataset.alert = "off";
    pendant?.(false);
    for (const cible of cibles) cible.classList.remove("alerte");
  }, ALERT_DURATION_MS);
}
