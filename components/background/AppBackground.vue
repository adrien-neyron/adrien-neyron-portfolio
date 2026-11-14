<script setup lang="ts">
/**
 * Halos décoratifs du fond des pages classiques. Couleurs : uniquement les rôles de main.css
 * (--color-accent, --color-secondary, --color-highlight), donc jour / nuit / thèmes « Bivouac » suivent
 * sans code JS ; seule l'intensité (--o) est adoucie en mode sombre. Purement décoratif : aria-hidden.
 */
const { isPaused } = useSceneState();
</script>

<template>
  <div aria-hidden="true">
    <div class="blob blob-a" :class="{ paused: isPaused }" />
    <div class="blob blob-b" :class="{ paused: isPaused }" />
    <div class="blob blob-c" :class="{ paused: isPaused }" />
  </div>
</template>

<style scoped>
.blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(90px);
  z-index: 1;
  pointer-events: none;
  will-change: transform;
}
.blob.paused { animation-play-state: paused; }

.blob-a {
  --o: 30%;
  width: 65vw; height: 65vw;
  top: -20vw; right: -15vw;
  background: radial-gradient(circle, color-mix(in srgb, var(--color-accent) var(--o), transparent) 0%, transparent 70%);
  animation: blobA 22s ease-in-out infinite;
}
.blob-b {
  --o: 28%;
  width: 55vw; height: 55vw;
  bottom: -15vw; left: -10vw;
  background: radial-gradient(circle, color-mix(in srgb, var(--color-secondary) var(--o), transparent) 0%, transparent 70%);
  animation: blobB 30s ease-in-out infinite;
}
.blob-c {
  --o: 18%;
  width: 45vw; height: 45vw;
  top: 25vh; left: 28vw;
  background: radial-gradient(circle, color-mix(in srgb, var(--color-highlight) var(--o), transparent) 0%, transparent 70%);
  animation: blobC 38s ease-in-out infinite;
}

/* mode sombre : halos un peu plus discrets */
:global(html.dark) .blob-a { --o: 22%; }
:global(html.dark) .blob-b { --o: 20%; }
:global(html.dark) .blob-c { --o: 13%; }

@keyframes blobA {
  0%,  100% { transform: translate(0, 0)    scale(1);    }
  30%        { transform: translate(-8vw, 6vh)  scale(1.12); }
  65%        { transform: translate(5vw, -4vh)  scale(0.92); }
}
@keyframes blobB {
  0%,  100% { transform: translate(0, 0)    scale(1);    }
  40%        { transform: translate(9vw, -7vh) scale(1.15); }
  72%        { transform: translate(-4vw, 5vh) scale(0.88); }
}
@keyframes blobC {
  0%,  100% { transform: translate(0, 0)       scale(1);    }
  50%        { transform: translate(-10vw, 7vh) scale(1.20); }
}

@media (prefers-reduced-motion: reduce) {
  .blob { animation: none; }
}
</style>
