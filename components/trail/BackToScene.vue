<script setup lang="ts">
/**
 * « ← Retour à la scène X » : en haut de chaque page de détail, ramène à la scène correspondante de l'accueil
 * (même ancre que le menu « Étapes »). Source unique : data/navigation.ts.
 */
import { NAV_STEPS, sceneHref } from "~/data/navigation";

const props = defineProps<{ scene: string }>();
const step = computed(() => NAV_STEPS.find((s) => s.scene === props.scene));
</script>

<template>
  <NuxtLink v-if="step" :to="sceneHref(step)" class="back-scene">
    <span aria-hidden="true">←</span>
    <span>Retour à la scène <strong>{{ step.metaphor }} · {{ step.label }}</strong><span class="sr-only"> de l'accueil</span></span>
  </NuxtLink>
</template>

<style scoped>
.back-scene {
  display: inline-flex; align-items: center; gap: 8px; min-height: 44px;
  margin-bottom: 8px; padding: 0 4px;
  font-family: var(--font-mono, ui-monospace, monospace); font-size: 0.8125rem;
  color: var(--color-accent); text-decoration: none;
}
.back-scene strong { font-weight: 600; }
.back-scene:hover span:last-child { text-decoration: underline; text-underline-offset: 4px; }
.back-scene:focus-visible { outline: 3px solid var(--color-accent); outline-offset: 2px; border-radius: 4px; }
</style>
