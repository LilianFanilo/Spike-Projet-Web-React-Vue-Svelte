<script lang="ts">
  // Un contrôle natif par type de variable (FR-011, FR-045). Chaque événement de saisie envoie
  // une valeur, sans regroupement (FR-012) : l'envoi est fait dans le gestionnaire, pas dans un effet.
  import type { VariableDef, VarValue } from "@shared/protocol.ts";

  interface Props {
    def: VariableDef;
    value: VarValue | undefined;
    onvaleur: (value: VarValue) => void;
  }

  let { def, value, onvaleur }: Props = $props();

  function nombre(event: Event & { currentTarget: HTMLInputElement }): void {
    const n = event.currentTarget.valueAsNumber;
    // Saisie partielle (« - », vide) ou hors bornes : rien à envoyer, le service la rejetterait.
    if (!Number.isInteger(n)) return;
    if ((def.min !== undefined && n < def.min) || (def.max !== undefined && n > def.max)) return;
    onvaleur(n);
  }
</script>

<label class="champ">
  <span>{def.label}</span>
  {#if def.type === "text"}
    <input
      type="text"
      data-var={def.id}
      maxlength={def.maxLength}
      value={String(value ?? "")}
      oninput={(e) => onvaleur(e.currentTarget.value)}
    />
  {:else if def.type === "number"}
    <input
      type="number"
      data-var={def.id}
      min={def.min}
      max={def.max}
      step="1"
      value={Number(value ?? 0)}
      oninput={nombre}
    />
  {:else if def.type === "boolean"}
    <input
      type="checkbox"
      data-var={def.id}
      checked={value === true}
      onchange={(e) => onvaleur(e.currentTarget.checked)}
    />
  {:else if def.type === "color"}
    <input
      type="color"
      data-var={def.id}
      value={String(value ?? "#000000")}
      oninput={(e) => onvaleur(e.currentTarget.value.toLowerCase())}
    />
  {:else if def.type === "speed"}
    <input
      type="range"
      data-var={def.id}
      min={def.min}
      max={def.max}
      step={def.step}
      value={Number(value ?? 0)}
      oninput={(e) => onvaleur(Number(e.currentTarget.value))}
    />
  {/if}
</label>

<style>
  .champ {
    display: grid;
    gap: 6px;
    font-size: 14px;
  }

  input[type="text"],
  input[type="number"] {
    padding: 8px;
    font-size: 16px;
  }
</style>
