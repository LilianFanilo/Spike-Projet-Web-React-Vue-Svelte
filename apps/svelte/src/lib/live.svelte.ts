// État réactif d'une page (research R4, data-model) : enveloppe l'unique connexion au service.

import { connect, type Connection } from "@shared/client.ts";
import {
  ALERT_DURATION_MS,
  type OverlayName,
  type VariableDef,
  type VarValue,
  type Values,
} from "@shared/protocol.ts";

export interface LiveOptions {
  role: "dashboard" | "overlay";
  name?: OverlayName;
  /** Vrai si une mise à jour reçue pour cette variable doit être ignorée (dashboard, research R6). */
  ignorer?: (id: string) => boolean;
}

export class Live {
  vars = $state.raw<VariableDef[]>([]);
  values = $state<Values>({});
  connected = $state(false);
  /** Vrai dès le premier message de bienvenue. */
  ready = $state(false);
  alerte = $state({ actif: false, numero: 0 });
  /** Instant (performance.now) de la dernière alerte, lu par la boucle 3D. */
  debut = -Infinity;

  #connection: Connection;
  #minuteur: ReturnType<typeof setTimeout> | undefined;

  constructor(options: LiveOptions) {
    this.#connection = connect({
      role: options.role,
      name: options.name,
      onStatus: (connected) => {
        this.connected = connected;
      },
      onWelcome: (vars, values) => {
        this.vars = vars;
        this.values = { ...values };
        this.ready = true;
      },
      onUpdate: (id, value) => {
        if (options.ignorer?.(id)) return;
        this.values[id] = value;
      },
      onAlert: () => this.#jouerAlerte(),
    });
  }

  def(id: string): VariableDef | undefined {
    return this.vars.find((d) => d.id === id);
  }

  set(id: string, value: VarValue): void {
    this.values[id] = value;
    this.#connection.set(id, value);
  }

  alert(): void {
    this.#connection.alert();
  }

  /** Relance l'alerte depuis le début : un seul minuteur, réarmé à chaque alerte (FR-023, FR-042). */
  #jouerAlerte(): void {
    this.debut = performance.now();
    this.alerte.numero += 1;
    this.alerte.actif = true;
    clearTimeout(this.#minuteur);
    this.#minuteur = setTimeout(() => {
      this.alerte.actif = false;
    }, ALERT_DURATION_MS);
  }
}
