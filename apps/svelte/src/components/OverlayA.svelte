<script lang="ts">
  // Overlay A (US2) : titre et score, animation d'alerte (FR-021 à FR-023, contrat DOM FR-040 à FR-042).
  import { serialize } from "@shared/protocol.ts";
  import { rejouer } from "../lib/alerte.ts";
  import { Live } from "../lib/live.svelte.ts";

  const live = new Live({ role: "overlay", name: "overlay-a" });

  const titre = $derived(String(live.values.titre ?? ""));
  const score = $derived(Number(live.values.score ?? 0));
</script>

<main data-alert={live.alerte.actif ? "on" : "off"}>
  {#if live.ready}
    <div class="carte" {@attach rejouer(live.alerte.numero)}>
      <h1 class="titre" data-var="titre" data-value={serialize("text", titre)}>{titre}</h1>
      <p class="score" data-var="score" data-value={serialize("number", score)}>{score}</p>
    </div>
  {/if}
</main>

<style>
  .carte {
    position: absolute;
    top: 60px;
    left: 80px;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
    transform-origin: left center;
  }

  .titre {
    margin: 0;
    min-height: 1.2em;
    max-width: 1760px;
    font-size: 64px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .score {
    margin: 8px 0 0;
    font-size: 96px;
    font-weight: 900;
    font-variant-numeric: tabular-nums;
  }
</style>
