// Unique connexion de la page au service de diffusion (research R2), branchée sur le store.
// Appelée par chaque point d'entrée avant createRoot : StrictMode ne peut pas la dédoubler.

import { connect, type Connection } from "@shared/client.ts";
import { normalize, validate, type OverlayName, type VarValue } from "@shared/protocol.ts";
import { useLive } from "./store.ts";

let connexion: Connection | null = null;

export function demarrer(role: "dashboard" | "overlay", name?: OverlayName): void {
  if (connexion) return;
  connexion = connect({
    role,
    name,
    onWelcome: (vars, values) => useLive.getState().bienvenue(vars, values),
    onUpdate: (id, value) => useLive.getState().miseAJour(id, value),
    onAlert: (seq) => useLive.getState().alerter(seq),
    onStatus: (connected) => useLive.getState().statut(connected),
  });
}

/** Saisie du dashboard : envoyée telle quelle, sans throttle ni debounce (FR-012). */
export function saisir(id: string, valeur: VarValue): void {
  const etat = useLive.getState();
  const def = etat.vars.find((d) => d.id === id);
  if (!def || !connexion || !etat.connected) return;
  // normalize avant validate : une position de curseur non arrondie échouerait au contrôle du pas (R4).
  const v = normalize(def, valeur);
  if (!validate(def, v)) return;
  etat.appliquerSaisie(id, v);
  connexion.set(id, v);
}

export function declencherAlerte(): void {
  connexion?.alert();
}
