<script setup lang="ts">
// Repli 2D (FR-033) : unique élément data-var="couleur" quand la 3D est indisponible.
import { enAttribut } from "../live/store.ts";

defineProps<{ couleur?: string }>();
</script>

<template>
  <div class="repli" data-var="couleur" :data-value="enAttribut('color', couleur)">
    <div class="disque" :style="{ background: couleur }"></div>
    <span>3D indisponible</span>
  </div>
</template>
