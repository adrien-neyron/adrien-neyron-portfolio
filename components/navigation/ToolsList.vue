<script setup lang="ts">
import { computed } from "vue";
import { Volume2, VolumeX, Moon, Sun, Pause, Play } from "lucide-vue-next";
import { useColorMode } from "#imports";

/**
 * Contenu du panneau « Outils » (mêmes réglages que l'accueil : jour / nuit, son, figer la scène).
 * Chaque réglage est un bouton à bascule (aria-pressed) ; l'accès à l'admin reste en bas.
 */
const { isMuted }  = useBackgroundAudio();
const { isPaused } = useSceneState();
const colorMode    = useColorMode();
const isDark       = computed(() => colorMode.value === "dark");

function toggleDark()  { colorMode.preference = isDark.value ? "light" : "dark"; }
function toggleAudio() { isMuted.value = !isMuted.value; }
function toggleScene() { isPaused.value = !isPaused.value; }
</script>

<template>
  <div class="tools" role="group" aria-label="Réglages d'affichage">
    <button type="button" class="tool" :aria-pressed="isDark" @click="toggleDark">
      <component :is="isDark ? Moon : Sun" :size="18" :stroke-width="1.6" aria-hidden="true" />
      <span>Mode nuit</span><i class="switch" aria-hidden="true" />
    </button>
    <button type="button" class="tool" :aria-pressed="!isMuted" @click="toggleAudio">
      <component :is="isMuted ? VolumeX : Volume2" :size="18" :stroke-width="1.6" aria-hidden="true" />
      <span>Son</span><i class="switch" aria-hidden="true" />
    </button>
    <button type="button" class="tool" :aria-pressed="isPaused" @click="toggleScene">
      <component :is="isPaused ? Play : Pause" :size="18" :stroke-width="1.6" aria-hidden="true" />
      <span>Pause de la scène</span><i class="switch" aria-hidden="true" />
    </button>
    <div class="admin">
      <ClientOnly><NavigationAdminNavButton /></ClientOnly>
      <span class="admin-l">Espace admin</span>
    </div>
  </div>
</template>

<style scoped>
.tools { display: flex; flex-direction: column; gap: 2px; padding: 0 8px 8px; }
.tool {
  display: grid; grid-template-columns: 22px 1fr auto; align-items: center; column-gap: 14px; width: 100%; min-height: 48px; padding: 6px 12px;
  border-radius: 12px; text-align: left; color: var(--color-text); font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.02em;
}
.tool:hover { background: color-mix(in srgb, var(--color-accent) 9%, transparent); }
.tool svg { color: var(--color-accent); }
/* interrupteur : l'état est porté par aria-pressed, la forme le montre aussi */
.switch { position: relative; width: 40px; height: 22px; border-radius: 999px; border: 1.5px solid var(--color-muted); }
.switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 15px; height: 15px; border-radius: 50%; background: var(--color-muted); transition: transform 0.2s, background 0.2s; }
.tool[aria-pressed="true"] .switch { border-color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 18%, transparent); }
.tool[aria-pressed="true"] .switch::after { transform: translateX(18px); background: var(--color-accent); }
.admin { display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 0 12px; border-top: 1px solid color-mix(in srgb, var(--color-muted) 30%, transparent); margin-top: 4px; }
.admin-l { font-family: var(--font-mono); font-size: 12px; color: var(--color-muted); }
@media (prefers-reduced-motion: reduce) { .switch::after { transition: none; } }
</style>
