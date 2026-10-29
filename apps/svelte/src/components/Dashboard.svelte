<script lang="ts">
  // Dashboard (US1) : champs générés depuis le message de bienvenue (FR-010), alerte, état de connexion.
  import { Live } from "../lib/live.svelte.ts";
  import Champ from "./Champ.svelte";

  // L'écho d'une saisie en cours écraserait la frappe suivante : le champ actif garde sa valeur (research R6).
  const ignorer = (id: string): boolean =>
    document.activeElement instanceof HTMLElement && document.activeElement.dataset.var === id;

  const live = new Live({ role: "dashboard", ignorer });
</script>

<main class="dashboard" data-connection={live.connected ? "on" : "off"}>
  <h1>Dashboard du live</h1>
  <p class={["etat", live.connected ? "on" : "off"]}>{live.connected ? "● Connecté" : "● Déconnecté"}</p>

  <div class="champs">
    {#each live.vars as def (def.id)}
      <Champ {def} value={live.values[def.id]} onvaleur={(v) => live.set(def.id, v)} />
    {/each}
  </div>

  <button class="alerte-btn" data-action="alerte" onclick={() => live.alert()}>Alerte</button>
</main>

<style>
  .dashboard {
    min-height: 100vh;
    box-sizing: border-box;
    padding: 32px;
    background: #16181d;
    color: #eceff4;
    overflow: auto;
  }

  h1 {
    margin: 0 0 8px;
    font-size: 24px;
  }

  .etat {
    margin: 0 0 24px;
    font-size: 14px;
  }

  .etat.on {
    color: #4ade80;
  }

  .etat.off {
    color: #f87171;
  }

  .champs {
    display: grid;
    gap: 16px;
    max-width: 480px;
  }

  .alerte-btn {
    margin-top: 24px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    background: #e0242c;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
  }
</style>
