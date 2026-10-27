// Unique connexion de la page au service de diffusion (contrat integration-apps.md : un seul connect()).
// La sonde de latence et le compteur FPS (?debug=1) sont pris en charge par @shared/client.ts.
import { createPinia } from "pinia";
import { createApp, type Component } from "vue";
import { connect } from "@shared/client.ts";
import type { OverlayName } from "@shared/protocol.ts";
import { useLiveStore, type LiveStore } from "./store.ts";

export type Role = { role: "dashboard" } | { role: "overlay"; name: OverlayName };

export function brancher(store: LiveStore, options: Role): void {
  const connexion = connect({
    ...options,
    onWelcome: (vars, values) => store.recevoirBienvenue(vars, values),
    onUpdate: (id, value) => store.recevoirMiseAJour(id, value),
    onAlert: () => store.recevoirAlerte(),
    onStatus: (connected) => store.changerStatut(connected),
  });
  store.attacher(connexion);
}

/** Crée l'app de la page, son store Pinia et sa connexion, puis la monte sur #app. */
export function demarrer(racine: Component, options: Role): void {
  const pinia = createPinia();
  const app = createApp(racine).use(pinia);
  brancher(useLiveStore(pinia), options);
  app.mount("#app");
}
