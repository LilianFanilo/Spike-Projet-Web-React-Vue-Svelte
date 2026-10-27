// État live d'une page (data-model.md) : définitions, valeurs courantes, connexion, alertes.
// Une instance par page ; seule src/live/connexion.ts écrit dedans via les mutations « recevoir* ».
import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import type { Connection } from "@shared/client.ts";
import { serialize, type Values, type VariableDef, type VarType, type VarValue } from "@shared/protocol.ts";

export const useLiveStore = defineStore("live", () => {
  const vars = ref<VariableDef[]>([]);
  const values = reactive<Values>({});
  const connected = ref(false);
  // Compteur local et non le seq du service : le service remet seq à 0 en redémarrant,
  // deux alertes successives pourraient alors porter le même numéro.
  const alertes = ref(0);

  let connexion: Connection | null = null;

  function attacher(c: Connection): void {
    connexion = c;
  }

  function recevoirBienvenue(defs: VariableDef[], courantes: Values): void {
    vars.value = defs;
    for (const id of Object.keys(values)) {
      if (!(id in courantes)) delete values[id];
    }
    Object.assign(values, courantes);
  }

  function recevoirMiseAJour(id: string, value: VarValue): void {
    values[id] = value;
  }

  function recevoirAlerte(): void {
    alertes.value++;
  }

  function changerStatut(etat: boolean): void {
    connected.value = etat;
  }

  // La valeur affichée vient toujours de l'écho `update` : la dernière modification diffusée l'emporte.
  function set(id: string, value: VarValue): void {
    connexion?.set(id, value);
  }

  function alerte(): void {
    connexion?.alert();
  }

  return {
    vars,
    values,
    connected,
    alertes,
    attacher,
    recevoirBienvenue,
    recevoirMiseAJour,
    recevoirAlerte,
    changerStatut,
    set,
    alerte,
  };
});

export type LiveStore = ReturnType<typeof useLiveStore>;

/** Valeur de data-value (FR-041), ou undefined (attribut absent) tant que le welcome n'est pas reçu. */
export function enAttribut(type: VarType, value: VarValue | undefined): string | undefined {
  return value === undefined ? undefined : serialize(type, value);
}
