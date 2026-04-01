<script setup lang="ts">
const route = useRoute();

const navItems = [
  { path: "/",          label: "Accueil",   hoverLabel: "Camp de Base"   },
  { path: "/projects",  label: "Projets",   hoverLabel: "Sentiers"       },
  { path: "/ai-tools",  label: "Outils",    hoverLabel: "Équipement IA"  },
  { path: "/about",     label: "Parcours",  hoverLabel: "Le Randonneur"  },
  { path: "/contact",   label: "Discutons", hoverLabel: "Bivouac"        },
];

const hoveredNav = ref<string | null>(null);

const isActive = (path: string) =>
  path === "/" ? route.path === "/" : route.path.startsWith(path);
</script>

<template>
  <nav
    aria-label="Navigation principale"
    class="fixed flex flex-row-reverse gap-7 top-[50%] left-[2.5em] transform -rotate-90 -translate-x-1/2 sm:gap-4 sm:text-sm"
  >
    <NuxtLink
      v-for="{ path, label, hoverLabel } in navItems"
      :key="path"
      :to="path"
      :aria-current="isActive(path) ? 'page' : undefined"
      :class="['no-underline navbar text-lg cursor-pointer', isActive(path) ? 'active' : '']"
      @mouseenter="hoveredNav = path"
      @mouseleave="hoveredNav = null"
    >
      <Transition name="nav-label" mode="out-in">
        <span
          :key="hoveredNav === path ? 'hover' : 'default'"
          :class="hoveredNav === path ? 'text-xs font-light tracking-wide whitespace-nowrap' : ''"
        >{{ hoveredNav === path ? hoverLabel : label }}</span>
      </Transition>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.nav-label-enter-active,
.nav-label-leave-active {
  transition: opacity 0.15s ease;
}
.nav-label-enter-from,
.nav-label-leave-to {
  opacity: 0;
}
</style>
