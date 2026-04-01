<script setup lang="ts">
const props = defineProps<{ isDark?: boolean }>();

const darkPalette = {
  color: "#1B4F72",
  emissiveColor: "#57C785",
  emissiveIntensity: 1.5,
  sphereOpacity: 0.28,
  sparkleColor: "#61DAFB",
  sparkleSize: 0.28,
};

const lightPalette = {
  color: "#FFF9C4",
  emissiveColor: "#FFD600",
  emissiveIntensity: 6,
  sphereOpacity: 0.78,
  sparkleColor: "#FFFFFF",
  sparkleSize: 0.65,
};

const palette = computed(() => props.isDark ? darkPalette : lightPalette);
const ambientIntensity = computed(() => props.isDark ? 0.6 : 1.8);
const dirIntensity    = computed(() => props.isDark ? 1   : 3);
</script>

<template>
  <!-- aria-hidden : rendu purement décoratif -->
  <TresCanvas
    aria-hidden="true"
    :style="{
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw', height: '100vh',
      zIndex: 2,
      pointerEvents: 'none',
    }"
    :camera="{ position: [0, 0, 15], fov: 70 }"
  >
    <TresAmbientLight :intensity="ambientIntensity" />
    <TresDirectionalLight :position="[5, 5, 5]" :intensity="dirIntensity" />
    <BackgroundExplodingStar v-bind="palette" :is-dark="isDark" />
  </TresCanvas>
</template>
