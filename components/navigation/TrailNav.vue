<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { Mountain, Map, Cpu, User, MessageCircle, Menu, X } from "lucide-vue-next";
import { useVisitorStore } from "~/stores/visitor";

const visitorStore = useVisitorStore();
const route        = useRoute();
const isScrolled   = ref(false);
const menuOpen     = ref(false);

const navLinks = [
  { path: "/",          label: "Camp de Base",  hoverLabel: "Accueil",   icon: Mountain },
  { path: "/projects",  label: "Sentiers",      hoverLabel: "Projets",   icon: Map },
  { path: "/ai-tools",  label: "Équipement IA", hoverLabel: "Outils",    icon: Cpu },
  { path: "/about",     label: "Le Randonneur", hoverLabel: "Mon Parcours",  icon: User },
  { path: "/contact",   label: "Bivouac",       hoverLabel: "Discutons", icon: MessageCircle },
];

const hoveredPath = ref<string | null>(null);

function isActive(path: string) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

onMounted(() => {
  const onScroll = () => { isScrolled.value = window.scrollY > 10; };
  window.addEventListener("scroll", onScroll);
  onUnmounted(() => window.removeEventListener("scroll", onScroll));
});

watch(() => route.path, () => { menuOpen.value = false; });
</script>

<template>
  <header
    role="banner"
    :class="[
      'fixed top-0 left-0 w-full z-50 transition-all duration-300',
      isScrolled ? 'bg-(--color-surface)/70 backdrop-blur-md shadow-sm' : 'bg-transparent',
    ]"
  >
    <div class="w-full px-6 py-3 flex items-center justify-between gap-4">

      <!-- Logo / Identité -->
      <NuxtLink to="/" class="flex flex-col leading-tight group shrink-0">
        <span class="font-bold text-sm tracking-wide text-(--color-text) group-hover:text-(--color-accent) transition-colors">
          Adrien Neyron
        </span>
        <span class="text-[10px] text-(--color-muted) font-mono">
          Dev × Trail × Formation
        </span>
      </NuxtLink>

      <!-- Navigation desktop -->
      <nav aria-label="Navigation principale" class="hidden md:flex items-center gap-1">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative',
            isActive(link.path)
              ? 'text-(--color-accent) bg-(--color-accent)/10 nav-trail-active'
              : 'text-(--color-text)/70 hover:text-(--color-accent) hover:bg-(--color-accent)/5',
          ]"
          @mouseenter="hoveredPath = link.path"
          @mouseleave="hoveredPath = null"
        >
          <component :is="link.icon" :size="13" aria-hidden="true" />
          <span class="inline-block w-[88px] text-center">
            <Transition name="nav-label" mode="out-in">
              <span :key="hoveredPath === link.path ? 'h' : 'd'" class="block">
                {{ hoveredPath === link.path ? link.hoverLabel : link.label }}
              </span>
            </Transition>
          </span>
        </NuxtLink>
      </nav>

      <!-- Droite : musique + visiteurs + thème -->
      <div class="flex items-center gap-3">
        <BackgroundMusic />

        <span
          v-if="visitorStore.count !== null"
          class="hidden sm:block text-[10px] text-(--color-muted) font-mono tabular-nums"
        >
          {{ visitorStore.count }} visiteurs
        </span>

        <ClientOnly><ThemeToggle /></ClientOnly>

        <!-- Accès admin (client-only pour éviter SSR sans plugin Auth0) -->
        <ClientOnly>
          <NavigationAdminNavButton />
        </ClientOnly>

        <!-- Hamburger mobile -->
        <button
          class="md:hidden p-1.5 rounded-lg hover:bg-(--color-accent)/10 text-(--color-text) transition-colors"
          :aria-label="menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <X v-if="menuOpen" :size="20" aria-hidden="true" />
          <Menu v-else :size="20" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Menu mobile -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <nav
        v-if="menuOpen"
        aria-label="Menu mobile"
        class="md:hidden bg-(--color-surface) border-t border-(--color-accent)/10 px-4 py-3 flex flex-col gap-1"
      >
        <NuxtLink
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
            isActive(link.path)
              ? 'text-(--color-accent) bg-(--color-accent)/10'
              : 'text-(--color-text)/70 hover:text-(--color-accent) hover:bg-(--color-accent)/5',
          ]"
        >
          <component :is="link.icon" :size="16" aria-hidden="true" />
          <span class="flex flex-col leading-tight">
            <span>{{ link.label }}</span>
            <span class="text-[10px] font-normal opacity-50">{{ link.hoverLabel }}</span>
          </span>
        </NuxtLink>
      </nav>
    </Transition>

    <!-- Barre de progression -->
    <div aria-hidden="true" class="absolute bottom-0 left-0 w-full h-px">
      <div
        id="scroll-progress"
        class="h-full w-0 transition-all duration-150"
        style="background-color: var(--color-accent);"
      />
    </div>
  </header>
</template>

<style scoped>
.nav-label-enter-active,
.nav-label-leave-active {
  transition: opacity 0.12s ease;
}
.nav-label-enter-from,
.nav-label-leave-to {
  opacity: 0;
}
</style>
