<script setup lang="ts">
// Overlay A (US2) : titre et score, animés à chaque alerte.
import { computed, ref } from "vue";
import { enAttribut, useLiveStore } from "../live/store.ts";
import { useAlerte } from "../live/useAlerte.ts";

const store = useLiveStore();
const carte = ref<HTMLElement | null>(null);
const { actif } = useAlerte(() => [carte.value]);

const titre = computed(() => store.values.titre);
const score = computed(() => store.values.score);
</script>

<template>
  <div class="overlay" :data-alert="actif ? 'on' : 'off'">
    <div ref="carte" class="carte">
      <h1 class="titre" data-var="titre" :data-value="enAttribut('text', titre)">{{ titre }}</h1>
      <p class="score" data-var="score" :data-value="enAttribut('number', score)">{{ score }}</p>
    </div>
  </div>
</template>
