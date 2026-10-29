<script setup lang="ts">
// Un champ du dashboard (FR-011, FR-012, FR-045) : contrôle natif adapté au type, bornes lues dans la définition.
import { computed, ref, watch } from "vue";
import type { VariableDef, VarValue } from "@shared/protocol.ts";
import { useLiveStore } from "../live/store.ts";

const props = defineProps<{ def: VariableDef }>();
const store = useLiveStore();

const INPUT_TYPE = { text: "text", number: "number", boolean: "checkbox", color: "color", speed: "range" } as const;
const type = computed(() => INPUT_TYPE[props.def.type]);
const pas = computed(() => (props.def.type === "number" ? 1 : props.def.step));

const input = ref<HTMLInputElement | null>(null);
// Valeur affichée : suit le store, sauf pendant la saisie (un écho en retard écraserait la frappe).
const affichee = ref<VarValue | undefined>(store.values[props.def.id]);
watch(
  () => store.values[props.def.id],
  (value) => {
    if (props.def.type === "boolean" || document.activeElement !== input.value) affichee.value = value;
  },
);

function lire(el: HTMLInputElement): VarValue | undefined {
  const { def } = props;
  switch (def.type) {
    case "boolean":
      return el.checked;
    case "number": {
      const n = Number(el.value);
      const ok = el.value !== "" && Number.isInteger(n) && n >= (def.min ?? -Infinity) && n <= (def.max ?? Infinity);
      return ok ? n : undefined;
    }
    case "speed":
      return Number(el.value);
    default:
      return el.value;
  }
}

// Chaque événement de saisie envoie aussitôt une mise à jour, sans regroupement (FR-012).
function envoyer(event: Event): void {
  const value = lire(event.target as HTMLInputElement);
  if (value !== undefined) store.set(props.def.id, value);
}
</script>

<template>
  <label class="champ">
    <span>{{ def.label }}</span>
    <input
      v-if="def.type === 'boolean'"
      ref="input"
      type="checkbox"
      :data-var="def.id"
      :checked="affichee === true"
      @change="envoyer"
    />
    <input
      v-else
      ref="input"
      :type="type"
      :data-var="def.id"
      :value="affichee === undefined ? '' : String(affichee)"
      :maxlength="def.maxLength"
      :min="def.min"
      :max="def.max"
      :step="pas"
      @input="envoyer"
      @blur="affichee = store.values[def.id]"
    />
  </label>
</template>
