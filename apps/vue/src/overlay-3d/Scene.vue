<script setup lang="ts">
// Scène TresJS : canvas transparent plein cadre, caméra, lumières et modèle.
import { TresCanvas } from "@tresjs/core";
import Modele from "./Modele.vue";

defineProps<{ couleur?: string; vitesse?: number; alerteDebut: number | null }>();
const emit = defineEmits<{ erreur: [] }>();
</script>

<template>
  <TresCanvas window-size alpha :clear-alpha="0" @error="emit('erreur')">
    <TresPerspectiveCamera :position="[0, 0, 4]" :look-at="[0, 0, 0]" />
    <TresAmbientLight :intensity="0.6" />
    <TresDirectionalLight :position="[3, 4, 5]" :intensity="1.5" />
    <Modele :couleur="couleur" :vitesse="vitesse" :alerte-debut="alerteDebut" @erreur="emit('erreur')" />
  </TresCanvas>
</template>
