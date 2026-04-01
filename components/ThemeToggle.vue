<script setup lang="ts">
import { ref, computed } from "vue";
import { Sun, Moon } from "lucide-vue-next";
import { useColorMode } from "#imports";

const colorMode = useColorMode();

const isLight   = computed(() => colorMode.value === "light");
const ariaLabel = computed(() =>
  isLight.value ? "Passer en mode sombre" : "Passer en mode clair"
);

function toggle() {
  colorMode.preference = isLight.value ? "dark" : "light";
}
</script>

<template>
  <button
    :aria-label="ariaLabel"
    class="w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 hover:bg-(--color-accent)/10"
    @click="toggle"
  >
    <Sun  v-if="isLight" :size="18" aria-hidden="true" class="text-(--color-accent)" />
    <Moon v-else          :size="18" aria-hidden="true" class="text-(--color-highlight)" />
  </button>
</template>
