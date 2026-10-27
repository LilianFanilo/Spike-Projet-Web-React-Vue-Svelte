<script setup lang="ts">
// Dashboard (US1) : un champ par variable reçue dans le welcome, dans l'ordre reçu (FR-010).
import { useLiveStore } from "../live/store.ts";
import Champ from "./Champ.vue";

const store = useLiveStore();
</script>

<template>
  <main class="dashboard" :data-connection="store.connected ? 'on' : 'off'">
    <h1>Dashboard — Vue</h1>
    <p class="etat">{{ store.connected ? "● Connecté" : "● Déconnecté" }}</p>
    <form class="champs" @submit.prevent>
      <Champ v-for="def in store.vars" :key="def.id" :def="def" />
    </form>
    <button type="button" class="alerte-btn" data-action="alerte" @click="store.alerte()">Alerte</button>
  </main>
</template>
