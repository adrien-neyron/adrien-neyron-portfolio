<script setup lang="ts">
import { useVisitorStore } from "~/stores/visitor";

const visitorStore = useVisitorStore();

onMounted(async () => {
  await visitorStore.fetchCount();
  await visitorStore.trackVisit();
});
</script>

<template>
  <!-- Lien d'évitement -->
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded-lg focus:shadow-xl focus:font-semibold"
  >
    Aller au contenu principal
  </a>

  <BackgroundAppBackground />

  <NavigationTrailNav />
  <ClientOnly><UiContactsAccess /></ClientOnly>

  <main id="main-content" class="relative z-[3] pt-14">
    <slot />
  </main>

  <AppFooter class="relative z-[3]" />
</template>
