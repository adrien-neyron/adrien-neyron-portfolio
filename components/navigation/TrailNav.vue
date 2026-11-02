<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from "vue";
import { NAV_STEPS } from "~/data/navigation";

/**
 * Menu unique des pages : mêmes étapes, même ordre et mêmes libellés que le menu de l'accueil
 * de l'accueil (data/navigation.ts). Réglages d'affichage (thème, son…) à gauche, menu à droite.
 */
const route    = useRoute();
const isOpen   = ref(false);
const burger   = ref<HTMLButtonElement | null>(null);
const drawer   = ref<HTMLElement | null>(null);

function isActive(path: string) {
  if (path === "/") return route.path === "/";
  return route.path === path || route.path.startsWith(path + "/");
}
const stepActive = (links: { path: string }[]) => links.some((l) => isActive(l.path));
function ariaCurrent(path: string): "page" | "true" | undefined {
  if (!isActive(path)) return undefined;
  return route.path === path ? "page" : "true";
}

// Ouvert : le défilement de la page est bloqué, le focus entre dans le menu ; fermé : il revient au bouton
watch(isOpen, async (open) => {
  if (!import.meta.client) return;
  document.body.style.overflow = open ? "hidden" : "";
  if (open) {
    await nextTick();
    drawer.value?.querySelector<HTMLElement>("a, button")?.focus();
  }
});
onUnmounted(() => { if (import.meta.client) document.body.style.overflow = ""; });

function close(returnFocus = true) {
  isOpen.value = false;
  if (returnFocus) nextTick(() => burger.value?.focus());
}
function onKey(e: KeyboardEvent) { if (e.key === "Escape" && isOpen.value) close(); }
watch(() => route.path, () => { isOpen.value = false; });
</script>

<template>
  <!-- Gestionnaire audio invisible -->
  <BackgroundMusic />

  <header role="banner" class="nav-header" @keydown="onKey">
    <div class="nav-inner">
      <!-- Gauche : réglages d'affichage -->
      <NavigationSettingsGear />

      <!-- Centre : identité (lien vers l'accueil) -->
      <NuxtLink to="/" class="identity" aria-label="Adrien Neyron, retour à l'accueil">Adrien Neyron</NuxtLink>

      <!-- Droite : menu des étapes -->
      <button
        ref="burger"
        type="button"
        class="menu-btn"
        :aria-expanded="isOpen"
        aria-controls="site-menu"
        @click="isOpen ? close(false) : (isOpen = true)"
      >
        <span class="topo-lines" aria-hidden="true"><i /><i /><i /></span>
        <span>Menu</span>
      </button>
    </div>
  </header>

  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="isOpen" class="nav-backdrop" aria-hidden="true" @click="close(false)" />
    </Transition>

    <Transition name="drawer">
      <nav v-if="isOpen" id="site-menu" ref="drawer" aria-label="Navigation principale" class="nav-drawer" @keydown="onKey">
        <div class="drawer-head">
          <span class="drawer-eyebrow">Parcours</span>
          <button type="button" class="drawer-close" @click="close()">Fermer<span class="sr-only"> le menu</span></button>
        </div>

        <ol class="stages">
          <li v-for="(step, i) in NAV_STEPS" :key="step.metaphor" :class="['stage', { 'is-active': stepActive(step.links) }]">
            <span class="stage-meta">
              <span class="stage-num" aria-hidden="true">{{ String(i + 1).padStart(2, "0") }}</span>
              <span class="stage-metaphor">{{ step.metaphor }}</span>
            </span>
            <span class="stage-links">
              <NuxtLink
                v-for="l in step.links"
                :key="l.path"
                :to="l.path"
                :aria-current="ariaCurrent(l.path)"
                :class="['stage-link', { 'is-active': isActive(l.path) }]"
              >{{ l.label }}</NuxtLink>
            </span>
          </li>
        </ol>

        <p class="drawer-foot">Dev · Trail · Formation</p>
      </nav>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Couleurs : uniquement les rôles de main.css (jour / nuit symétriques) */
.nav-header {
  position: fixed; top: 0; left: 0; width: 100%; z-index: 50;
  background: color-mix(in srgb, var(--color-bg) 86%, transparent);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
}
.nav-inner { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 16px; min-height: 56px; }

.identity {
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--color-text); text-decoration: none; padding: 10px 8px; min-height: 44px; display: inline-flex; align-items: center;
}
.identity:hover { color: var(--color-accent); }

/* bouton « Menu » : libellé toujours visible (la métaphore seule ne suffit pas) */
.menu-btn {
  display: inline-flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 14px;
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--color-text); background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-accent) 45%, transparent); border-radius: 999px;
  transition: border-color 0.2s, color 0.2s;
}
.menu-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.topo-lines { position: relative; width: 20px; height: 14px; display: block; }
.topo-lines i { position: absolute; right: 0; height: 1.5px; border-radius: 2px; background: var(--color-accent); }
.topo-lines i:nth-child(1) { top: 1px;  width: 20px; }
.topo-lines i:nth-child(2) { top: 6px;  width: 14px; opacity: 0.7; }
.topo-lines i:nth-child(3) { top: 11px; width: 8px;  opacity: 0.45; }

.nav-backdrop { position: fixed; inset: 0; z-index: 55; background: color-mix(in srgb, var(--color-text) 45%, transparent); backdrop-filter: blur(3px); }
.overlay-enter-active { transition: opacity 0.3s ease-out; }
.overlay-leave-active { transition: opacity 0.22s ease-in; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

.nav-drawer {
  position: fixed; right: 0; top: 0; bottom: 0; width: min(340px, 100vw); z-index: 56;
  display: flex; flex-direction: column; padding: 20px 22px; overflow-y: auto;
  background: var(--color-bg); color: var(--color-text);
  border-left: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
}
.drawer-enter-active { transition: transform 0.35s cubic-bezier(0.23, 1, 0.32, 1); }
.drawer-leave-active { transition: transform 0.25s cubic-bezier(0.55, 0, 1, 0.45); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }

.drawer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.drawer-eyebrow { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-muted); }
.drawer-close {
  min-height: 44px; padding: 0 14px; border-radius: 999px; font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--color-text); border: 1px solid color-mix(in srgb, var(--color-muted) 60%, transparent);
}
.drawer-close:hover { color: var(--color-accent); border-color: var(--color-accent); }

.stages { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; flex: 1; }
.stage { display: grid; grid-template-columns: 1fr; gap: 4px; padding: 14px 0; border-top: 1px solid color-mix(in srgb, var(--color-muted) 30%, transparent); }
.stage:last-child { border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 30%, transparent); }
.stage-meta { display: flex; align-items: baseline; gap: 10px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-muted); }
.stage.is-active .stage-meta { color: var(--color-accent); }
.stage-links { display: flex; flex-wrap: wrap; gap: 2px 18px; }
.stage-link {
  display: inline-flex; align-items: center; min-height: 44px; font-family: var(--font-title); font-size: 1.6rem; line-height: 1.1;
  color: var(--color-text); text-decoration: none;
}
.stage-link:hover { color: var(--color-accent); }
.stage-link.is-active { color: var(--color-accent); text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 6px; }

.drawer-foot { margin: 22px 0 0; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-muted); }

@media (prefers-reduced-motion: reduce) {
  .overlay-enter-active, .overlay-leave-active, .drawer-enter-active, .drawer-leave-active { transition: none; }
}
</style>
