<script lang="ts">
  // Overlay B (US2) : bandeau « EN DIRECT » piloté par la seule variable `bandeau` (FR-021, FR-040).
  import { serialize } from "@shared/protocol.ts";
  import { rejouer } from "../lib/alerte.ts";
  import { Live } from "../lib/live.svelte.ts";

  const live = new Live({ role: "overlay", name: "overlay-b" });

  const visible = $derived(live.values.bandeau === true);
</script>

<main data-alert={live.alerte.actif ? "on" : "off"}>
  {#if live.ready}
    <!-- Toujours présent pour le contrat DOM, masqué quand la variable est fausse. -->
    <div
      class={["bandeau", !visible && "cache"]}
      data-var="bandeau"
      data-value={serialize("boolean", visible)}
      {@attach rejouer(live.alerte.numero)}
    >
      EN DIRECT
    </div>
  {/if}
</main>

<style>
  .bandeau {
    position: absolute;
    left: 50%;
    bottom: 80px;
    translate: -50% 0;
    padding: 16px 48px;
    border-radius: 12px;
    background: #e0242c;
    color: #fff;
    font-size: 56px;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  .cache {
    display: none;
  }
</style>
