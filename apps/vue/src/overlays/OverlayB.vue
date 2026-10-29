<script setup lang="ts">
// Overlay B (US2) : bandeau « EN DIRECT », toujours rendu et masqué selon la variable bandeau (FR-021).
import { computed, ref } from "vue";
import { enAttribut, useLiveStore } from "../live/store.ts";
import { useAlerte } from "../live/useAlerte.ts";

const store = useLiveStore();
const bandeau = ref<HTMLElement | null>(null);
const { actif } = useAlerte(() => [bandeau.value]);

const visible = computed(() => store.values.bandeau);
</script>

<template>
  <div class="overlay" :data-alert="actif ? 'on' : 'off'">
    <div
      v-show="visible === true"
      ref="bandeau"
      class="bandeau"
      data-var="bandeau"
      :data-value="enAttribut('boolean', visible)"
    >EN DIRECT</div>
  </div>
</template>
