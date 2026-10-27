<script setup lang="ts">
// Overlay 3D (US3) : scène TresJS, ou repli 2D si WebGL manque ou si le modèle ne se charge pas.
import { computed, ref } from "vue";
import { enAttribut, useLiveStore } from "../live/store.ts";
import { useAlerte } from "../live/useAlerte.ts";
import Repli from "./Repli.vue";
import Scene from "./Scene.vue";

function webglDisponible(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2") ?? document.createElement("canvas").getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext(); // libère le contexte d'essai
    return gl !== null;
  } catch {
    return false;
  }
}

const store = useLiveStore();
const { actif, debut } = useAlerte();

// Une fois en repli, on y reste.
const mode = ref<"scene" | "repli">(webglDisponible() ? "scene" : "repli");

const couleur = computed(() => store.values.couleur as string | undefined);
const vitesse = computed(() => store.values.vitesse as number | undefined);
</script>

<template>
  <div class="overlay" :data-alert="actif ? 'on' : 'off'">
    <div v-if="mode === 'scene'" class="scene">
      <Scene :couleur="couleur" :vitesse="vitesse" :alerte-debut="debut" @erreur="mode = 'repli'" />
      <span class="cache" data-var="couleur" :data-value="enAttribut('color', couleur)"></span>
    </div>
    <Repli v-else :couleur="couleur" />
    <span class="cache" data-var="vitesse" :data-value="enAttribut('speed', vitesse)"></span>
  </div>
</template>
