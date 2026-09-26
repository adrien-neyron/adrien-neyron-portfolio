<script setup lang="ts">
import { useVisitorStore } from "~/stores/visitor";

const visitorStore = useVisitorStore();
const route  = useRoute();
const router = useRouter();

onMounted(async () => {
  await visitorStore.fetchCount();
  await visitorStore.trackVisit();
});

// ─── Moment de la page (refonte « L'ascension ») ─────────────────────────
// Chaque rubrique a son moment de la journée ; les couleurs correspondantes sont
// définies dans assets/css/main.css (html[data-time=…]). Indépendant du mode
// Jour / Nuit choisi par le visiteur (classe .dark de @nuxtjs/color-mode).
type PageTime = "dawn" | "day" | "golden" | "night";
const TIME_BY_SECTION: Array<[prefix: string, time: PageTime]> = [
  ["/about",    "dawn"],    // Le Randonneur
  ["/carnet",   "golden"],  // Carnet
  ["/contact",  "night"],   // Bivouac
  ["/projects", "day"],     // Sentiers
  ["/ai-tools", "day"],     // Équipement
  ["/outils",   "day"],
];
const pageTime = computed<PageTime>(() =>
  TIME_BY_SECTION.find(([prefix]) => route.path.startsWith(prefix))?.[1] ?? "day"
);
useHead({ htmlAttrs: { "data-time": pageTime } });

// ─── Changement de page accessible ───────────────────────────────────────
// Après une navigation côté client : focus sur le titre de la nouvelle page
// (sinon le focus reste sur le lien cliqué, qui n'existe plus) et annonce du
// titre aux lecteurs d'écran. Rien au premier chargement.
const announcement = ref("");

const stopAfterEach = router.afterEach((to, from) => {
  if (!import.meta.client) return;
  if (from.matched.length === 0) return; // chargement initial
  if (to.path === from.path) return;     // simple changement d'ancre ou de query
  // on attend le rendu de la page et la mise à jour du <title> par useHead
  setTimeout(() => {
    const heading = document.querySelector<HTMLElement>("#main-content h1");
    if (heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    announcement.value = "";
    requestAnimationFrame(() => { announcement.value = `Page : ${document.title}`; });
  }, 150);
});
onUnmounted(stopAfterEach);
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

  <!-- Annonce des changements de page (lecteurs d'écran) -->
  <p class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
</template>

<style>
/* Titre ciblé par programme après une navigation : pas de contour visible,
   le focus clavier suivant repart de là. */
#main-content h1[tabindex="-1"]:focus { outline: none; }
</style>
