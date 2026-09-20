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
  >
    <!-- La caméra doit être déclarée comme un vrai composant Tres (make-default),
         pas comme un objet d'options passé au prop `camera` du Canvas : ce prop
         attend une instance de caméra THREE, pas des options de construction.
         C'est ce qui causait "camera is not an instance of THREE.Camera" à
         chaque frame et le crash en boucle ("setContext" sur undefined) — le
         renderer recevait l'objet brut { position, fov } au lieu d'une vraie
         THREE.PerspectiveCamera. -->
    <TresPerspectiveCamera :position="[0, 0, 15]" :fov="70" make-default />
    <TresAmbientLight :intensity="ambientIntensity" />
    <TresDirectionalLight :position="[5, 5, 5]" :intensity="dirIntensity" />
    <BackgroundExplodingStar v-bind="palette" :is-dark="isDark" />
  </TresCanvas>
</template>
