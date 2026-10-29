// Store Zustand d'une page : copie locale de l'état du service (specs/003-spike-react/data-model.md).
// Alimenté par connexion.ts, hors de l'arbre React ; lu par les composants avec des sélecteurs.

import { create } from "zustand";
import { ALERT_DURATION_MS, type VariableDef, type VarValue, type Values } from "@shared/protocol.ts";

interface EtatLive {
  vars: VariableDef[];
  values: Values;
  connected: boolean;
  alerte: { seq: number; active: boolean };
  /** Dashboard : nombre de `set` envoyés dont l'écho n'est pas encore revenu (research R4). */
  pending: Record<string, number>;
  bienvenue(vars: VariableDef[], values: Values): void;
  miseAJour(id: string, value: VarValue): void;
  statut(connected: boolean): void;
  alerter(seq: number): void;
  appliquerSaisie(id: string, value: VarValue): void;
}

let minuteur: ReturnType<typeof setTimeout> | undefined;

export const useLive = create<EtatLive>()((set, get) => ({
  vars: [],
  values: {},
  connected: false,
  alerte: { seq: 0, active: false },
  pending: {},

  bienvenue: (vars, values) => set({ vars, values, pending: {} }),

  miseAJour: (id, value) => {
    const enAttente = get().pending[id] ?? 0;
    if (enAttente > 0) {
      // Écho d'une saisie locale : seul le dernier fait foi, c'est la valeur retenue par le service.
      const reste = enAttente - 1;
      set((s) => ({
        pending: { ...s.pending, [id]: reste },
        ...(reste === 0 ? { values: { ...s.values, [id]: value } } : {}),
      }));
      return;
    }
    set((s) => ({ values: { ...s.values, [id]: value } }));
  },

  statut: (connected) => set({ connected }),

  alerter: (seq) => {
    set({ alerte: { seq, active: true } });
    clearTimeout(minuteur);
    minuteur = setTimeout(() => set((s) => ({ alerte: { seq: s.alerte.seq, active: false } })), ALERT_DURATION_MS);
  },

  appliquerSaisie: (id, value) =>
    set((s) => ({
      values: { ...s.values, [id]: value },
      pending: { ...s.pending, [id]: (s.pending[id] ?? 0) + 1 },
    })),
}));
