<script setup lang="ts">
// Modèle 3D (FR-030 à FR-032) : rotation continue, couleur suivie, saut d'alerte, sans librairie d'animation.
import { useGLTF } from "@tresjs/cientos";
import { useLoop } from "@tresjs/core";
import type { Group, Mesh } from "three";
import { shallowRef, watch, watchEffect } from "vue";
import modelUrl from "@shared/assets/model.glb?url";
import { ALERT_DURATION_MS } from "@shared/protocol.ts";

const props = defineProps<{ couleur?: string; vitesse?: number; alerteDebut: number | null }>();
const emit = defineEmits<{ erreur: [] }>();

// Un échec de chargement laisse state à null une fois isLoading repassé à false (useAsyncState de VueUse).
const { state, isLoading } = useGLTF(modelUrl);
watch(isLoading, (enCours) => {
  if (!enCours && !state.value) emit("erreur");
});

watchEffect(() => {
  const scene = state.value?.scene;
  const couleur = props.couleur;
  if (!scene || !couleur) return;
  scene.traverse((objet) => {
    const material = (objet as Mesh).material;
    if (material && "color" in material) (material.color as { set(c: string): void }).set(couleur);
  });
});

const groupe = shallowRef<Group | null>(null);
let angle = 0;

const { onBeforeRender } = useLoop();
onBeforeRender(({ delta }) => {
  const g = groupe.value;
  if (!g) return;
  angle = (angle + (props.vitesse ?? 0) * 2 * Math.PI * delta) % (2 * Math.PI);
  let saut = 0;
  let tours = 0;
  if (props.alerteDebut !== null) {
    // Saut de 0,5 unité et 2 tours supplémentaires en 2 s, courbe ease-out (FR-032).
    const t = Math.min(Math.max((performance.now() - props.alerteDebut) / ALERT_DURATION_MS, 0), 1);
    const e = 1 - (1 - t) ** 3;
    saut = 0.5 * Math.sin(Math.PI * e);
    tours = 4 * Math.PI * e;
  }
  g.position.y = saut;
  g.rotation.y = angle + tours;
});
</script>

<template>
  <TresGroup ref="groupe">
    <primitive v-if="state" :object="state.scene" />
  </TresGroup>
</template>
