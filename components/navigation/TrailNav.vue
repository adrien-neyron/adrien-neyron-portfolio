<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { Mountain, Map, Cpu, NotebookPen, User, MessageCircle } from "lucide-vue-next";
import { useVisitorStore } from "~/stores/visitor";

const visitorStore = useVisitorStore();
const route        = useRoute();
const isScrolled   = ref(false);
const menuOpen     = ref(false);

const navLinks = [
  { path: "/",          label: "Camp de Base",  hoverLabel: "Accueil",      icon: Mountain },
  { path: "/projects",  label: "Sentiers",      hoverLabel: "Projets",      icon: Map },
  { path: "/carnet",    label: "Carnet",        hoverLabel: "Journal",      icon: NotebookPen },
  { path: "/ai-tools",  label: "Équipement",    hoverLabel: "Outils",       icon: Cpu },
  { path: "/about",     label: "Le Randonneur", hoverLabel: "Mon Parcours", icon: User },
  { path: "/contact",   label: "Bivouac",       hoverLabel: "Discutons",    icon: MessageCircle },
];

function isActive(path: string) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

function ariaCurrent(path: string): "page" | "true" | undefined {
  if (!isActive(path)) return undefined;
  return route.path === path ? "page" : "true";
}

onMounted(() => {
  const onScroll = () => { isScrolled.value = window.scrollY > 10; };
  window.addEventListener("scroll", onScroll);
  onUnmounted(() => window.removeEventListener("scroll", onScroll));
});

watch(menuOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? "hidden" : "";
});

onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = "";
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

      <!-- Navigation desktop — masquée, remplacée par le burger -->
      <nav aria-label="Navigation principale" class="hidden items-center gap-1">
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
          :aria-current="ariaCurrent(link.path)"
        >
          <component :is="link.icon" :size="13" aria-hidden="true" />
          <span class="whitespace-nowrap">
            {{ link.label }}<span class="font-normal text-(--color-muted)"> · {{ link.hoverLabel }}</span>
          </span>
        </NuxtLink>
      </nav>

      <!-- Droite : musique + visiteurs + thème + admin + burger -->
      <div class="flex items-center gap-3">
        <BackgroundMusic />

        <span
          v-if="visitorStore.count !== null"
          class="hidden sm:block text-[10px] text-(--color-muted) font-mono tabular-nums"
        >
          {{ visitorStore.count }} visiteurs
        </span>

        <ClientOnly><ThemeToggle /></ClientOnly>
        <ClientOnly><NavigationAdminNavButton /></ClientOnly>

        <!-- Burger — 3 barres animées en X -->
        <button
          class="w-9 h-9 flex flex-col justify-center items-center gap-[5px] rounded-lg hover:bg-(--color-accent)/10 transition-colors"
          :aria-label="menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <span class="burger-bar" :class="{ 'open-top': menuOpen }" />
          <span class="burger-bar" :class="{ 'open-mid': menuOpen }" />
          <span class="burger-bar" :class="{ 'open-bot': menuOpen }" />
        </button>
      </div>
    </div>

    <!-- Barre de progression -->
    <div aria-hidden="true" class="absolute bottom-0 left-0 w-full h-px">
      <div
        id="scroll-progress"
        class="h-full w-0 transition-all duration-150"
        style="background-color: var(--color-accent);"
      />
    </div>
  </header>

  <!-- Menu mobile — overlay plein écran téléporté hors du header -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-3"
    >
      <nav
        v-if="menuOpen"
        aria-label="Menu mobile"
        class="fixed inset-x-0 top-0 bottom-0 z-40 flex flex-col pt-14 px-5 pb-8 overflow-y-auto mobile-overlay"
      >
        <!-- Séparateur sous le header -->
        <div class="mobile-separator mb-8" />

        <!-- Liens -->
        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="(link, i) in navLinks"
            :key="link.path"
            :to="link.path"
            :aria-current="ariaCurrent(link.path)"
            :style="{ animationDelay: `${i * 45}ms` }"
            :class="[
              'group mobile-link flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200',
              isActive(link.path)
                ? 'text-(--color-accent) bg-(--color-accent)/10'
                : 'text-(--color-text)/70 hover:text-(--color-accent) hover:bg-(--color-accent)/5',
            ]"
          >
            <!-- Icône dans un carré arrondi -->
            <span
              :class="[
                'w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors duration-200',
                isActive(link.path)
                  ? 'bg-(--color-accent)/15'
                  : 'bg-(--color-surface) group-hover:bg-(--color-accent)/10',
              ]"
            >
              <component :is="link.icon" :size="17" aria-hidden="true" />
            </span>

            <!-- Nom de la rubrique + sous-titre explicite -->
            <span class="flex flex-col leading-tight">
              <span class="text-sm font-semibold">{{ link.label }}</span>
              <span class="text-[11px] font-normal text-(--color-muted) mt-0.5">{{ link.hoverLabel }}</span>
            </span>

            <!-- Point indicateur : rubrique active -->
            <span
              v-if="isActive(link.path)"
              class="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
              style="background-color: var(--color-accent);"
              aria-hidden="true"
            />
          </NuxtLink>
        </div>

        <!-- Pied de menu -->
        <div class="mt-auto pt-6 flex flex-col items-center gap-1.5">
          <div class="mobile-separator-sm" />
          <span
            v-if="visitorStore.count !== null"
            class="text-[10px] font-mono tabular-nums text-(--color-muted)"
          >
            {{ visitorStore.count }} visiteurs
          </span>
          <span class="text-[10px] font-mono text-(--color-muted) opacity-50">
            Dev × Trail × Formation
          </span>
        </div>
      </nav>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ─── Burger : 3 barres → X ─── */
.burger-bar {
  display: block;
  width: 18px;
  height: 2px;
  background-color: var(--color-accent);
  border-radius: 2px;
  transition: transform 0.28s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.2s ease, width 0.2s ease;
  transform-origin: center;
}
.open-top { transform: translateY(7px) rotate(45deg); }
.open-mid { opacity: 0; width: 0; }
.open-bot { transform: translateY(-7px) rotate(-45deg); }

/* ─── Overlay mobile ─── */
.mobile-overlay {
  background-color: color-mix(in srgb, var(--color-bg) 97%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.mobile-separator {
  width: 100%;
  height: 1px;
  background-color: color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.mobile-separator-sm {
  width: 2rem;
  height: 1px;
  background-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  margin-bottom: 0.25rem;
}

/* ─── Entrée décalée des liens ─── */
.mobile-link {
  animation: link-slide-in 0.35s ease-out both;
}

@keyframes link-slide-in {
  from { opacity: 0; transform: translateX(-10px); }
  to   { opacity: 1; transform: translateX(0); }
}
</style>
