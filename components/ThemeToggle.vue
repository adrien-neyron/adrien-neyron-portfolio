<script setup lang="ts">
import { computed } from "vue";
import { Sun, Moon } from "lucide-vue-next";
import { useColorMode } from "#imports";

// Bouton bascule Jour / Nuit (préférence du visiteur).
// Accessibilité : nom accessible stable (« Mode nuit ») + état exposé par aria-pressed,
// plutôt qu'un libellé qui change à chaque clic (RGAA 7.1 / WCAG 4.1.2).
const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === "dark");

function toggle() {
  colorMode.preference = isDark.value ? "light" : "dark";
}
</script>

<template>
  <button
    type="button"
    aria-label="Mode nuit"
    :aria-pressed="isDark"
    :title="isDark ? 'Mode nuit activé' : 'Activer le mode nuit'"
    class="w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 hover:bg-(--color-accent)/10"
    @click="toggle"
  >
    <Moon v-if="isDark" :size="18" aria-hidden="true" class="text-(--color-accent)" />
    <Sun  v-else        :size="18" aria-hidden="true" class="text-(--color-accent)" />
  </button>
</template>
