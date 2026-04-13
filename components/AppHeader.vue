<script setup lang="ts">
import { useVisitorStore } from "~/stores/visitor";
import { useColorMode } from "#imports";

const visitorStore = useVisitorStore();
const colorMode   = useColorMode();
const isScrolled  = ref(false);

onMounted(() => {
  const onScroll = () => { isScrolled.value = window.scrollY > 10; };
  window.addEventListener("scroll", onScroll);
  onUnmounted(() => window.removeEventListener("scroll", onScroll));
});

const isDark = computed(() => colorMode.value === "dark");
</script>

<template>
  <header
    id="header"
    role="banner"
    :class="[
      'fixed top-0 left-0 w-full z-50 transition-all duration-300',
      isScrolled ? 'bg-black/20 backdrop-blur-sm' : 'bg-transparent',
    ]"
  >
    <div class="flex flex-col sm:flex-row justify-between items-center px-[2.5em] py-3 text-gray-900 dark:text-white text-sm gap-1 sm:gap-0">
      <!-- Titre -->
      <div class="flex flex-col items-center sm:items-start">
        <a
          href="#home"
          :class="['font-semibold', isDark ? 'hover:text-[#61DAFB]' : 'hover:text-[#FF6B2D]']"
        >
          Adrien Neyron
        </a>
        <span class="opacity-70">Fullstack JS · Vue.js / Node.js · AI &amp; Automation</span>
      </div>

      <BackgroundMusic />

      <!-- Compteur visiteurs -->
      <div
        v-if="visitorStore.count !== null"
        class="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-0 tabular-nums"
      >
        {{ visitorStore.count }} visiteurs
      </div>
    </div>

    <!-- Barre de progression -->
    <div aria-hidden="true" class="fixed top-0 left-0 w-full z-[60]">
      <div class="h-[2px] bg-transparent">
        <div
          id="scroll-progress"
          :class="['h-full w-0 transition-all duration-200', isDark ? 'bg-[#57C785]' : 'bg-[#FF6B2D]']"
        />
      </div>
    </div>
  </header>
</template>
