<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from "vue";
import { NAV_STEPS } from "~/data/navigation";

/**
 * En-tête unique des pages, calqué sur celui de l'accueil : marque à gauche, puis « Menu | Projets | Outils »
 * (mêmes libellés, même ordre), panneaux déroulants centrés sous l'en-tête. Le panneau « Menu » liste les étapes
 * de data/navigation.ts (mêmes que l'accueil) et indique « vous êtes ici » ; sur une fiche projet, la ligne
 * « Projets » porte le nom du projet (useState « nav-sub », renseigné par la fiche).
 */
type Panel = "menu" | "tools" | null;
const route  = useRoute();
const panel  = ref<Panel>(null);
const menuBtn  = ref<HTMLButtonElement | null>(null);
const toolsBtn = ref<HTMLButtonElement | null>(null);
const menuEl   = ref<HTMLElement | null>(null);
const toolsEl  = ref<HTMLElement | null>(null);
const sub = useState<string>("nav-sub", () => "");

function isActive(path: string) {
  if (path === "/") return route.path === "/";
  return route.path === path || route.path.startsWith(path + "/");
}
const stepActive = (links: { path: string }[]) => links.some((l) => isActive(l.path));
function ariaCurrent(path: string): "page" | "true" | undefined {
  if (!isActive(path)) return undefined;
  return route.path === path ? "page" : "true";
}
const projectsCurrent = computed(() => ariaCurrent("/projects"));

function toggle(p: Exclude<Panel, null>) { panel.value = panel.value === p ? null : p; }
function close(returnFocus = true) {
  const was = panel.value;
  panel.value = null;
  if (returnFocus && was) nextTick(() => (was === "menu" ? menuBtn : toolsBtn).value?.focus());
}
function onKey(e: KeyboardEvent) { if (e.key === "Escape" && panel.value) close(); }

// Ouvert : le focus entre dans le panneau ; Échap ou clic à côté le referme et rend le focus au bouton
watch(panel, async (p) => {
  if (!p) return;
  await nextTick();
  (p === "menu" ? menuEl : toolsEl).value?.querySelector<HTMLElement>("a, button")?.focus();
});
watch(() => route.path, () => { panel.value = null; });
onUnmounted(() => { panel.value = null; });
</script>

<template>
  <!-- Gestionnaire audio invisible -->
  <BackgroundMusic />

  <header role="banner" class="nav-header" @keydown="onKey">
    <div class="nav-inner">
      <NuxtLink to="/" class="brand" aria-label="Cordée, retour à l'accueil">
        <svg class="logo" aria-hidden="true" focusable="false" viewBox="0 0 40 56">
          <g transform="rotate(20 20 28)" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 5C29 5 33 12 31 20L27.5 44C26.6 50 22.6 52.6 18.2 52.6C11.4 52.6 7 48.4 8 42L13 14C14 8.4 16.2 5 20 5Z" stroke="var(--color-accent)" stroke-width="4.6" />
            <path d="M20 5C29 5 33 12 31 20L27.5 44C26.6 50 22.6 52.6 18.2 52.6C11.4 52.6 7 48.4 8 42L13 14C14 8.4 16.2 5 20 5Z" stroke="var(--color-bg)" stroke-opacity=".55" stroke-width="4.6" stroke-dasharray="1 2.1" />
            <path d="M30.6 22L27.4 43" stroke="var(--color-accent)" stroke-width="3.2" />
            <rect x="25" y="27.5" width="7.2" height="10.5" rx="2" transform="rotate(8 28.6 32.8)" fill="var(--color-bg)" stroke="var(--color-accent)" stroke-width="1.6" />
          </g>
        </svg>
        <span class="bn">Cordée</span>
      </NuxtLink>

      <div class="topnav">
        <button ref="menuBtn" type="button" class="top-btn" :aria-expanded="panel === 'menu'" aria-controls="site-menu" @click="toggle('menu')">Menu</button>
        <span class="sep" aria-hidden="true" />
        <NuxtLink to="/projects" class="top-btn" :aria-current="projectsCurrent">Projets</NuxtLink>
        <span class="sep" aria-hidden="true" />
        <button ref="toolsBtn" type="button" class="top-btn" :aria-expanded="panel === 'tools'" aria-controls="site-tools" @click="toggle('tools')">Outils</button>
      </div>
      <span aria-hidden="true" />
    </div>
  </header>

  <Teleport to="body">
    <div v-if="panel" class="nav-backdrop" aria-hidden="true" @click="close(false)" />

    <Transition name="drop">
      <nav v-if="panel === 'menu'" id="site-menu" ref="menuEl" aria-label="Plan du site" class="panel" @keydown="onKey">
        <div class="panel-head">
          <span class="panel-eyebrow">Parcours</span>
          <button type="button" class="panel-close" @click="close()">Fermer<span class="sr-only"> le menu</span></button>
        </div>
        <ol class="steps">
          <li v-for="(step, i) in NAV_STEPS" :key="step.metaphor" :class="['step', { 'is-active': stepActive(step.links) }]">
            <p class="step-h"><span class="step-n" aria-hidden="true">{{ String(i + 1).padStart(2, "0") }}</span>{{ step.metaphor }}</p>
            <ul class="step-links">
              <li v-for="l in step.links" :key="l.path">
                <NuxtLink :to="l.path" :aria-current="ariaCurrent(l.path)" :class="['lnk', { 'is-active': isActive(l.path) }]">{{ l.label }}</NuxtLink>
                <p v-if="l.path === '/projects' && sub" class="here"><span class="sr-only">Vous êtes ici : </span><span aria-hidden="true">↳ </span>{{ sub }}</p>
              </li>
            </ul>
          </li>
        </ol>
      </nav>
    </Transition>

    <Transition name="drop">
      <section v-if="panel === 'tools'" id="site-tools" ref="toolsEl" aria-label="Outils" class="panel" @keydown="onKey">
        <div class="panel-head">
          <span class="panel-eyebrow">Outils</span>
          <button type="button" class="panel-close" @click="close()">Fermer<span class="sr-only"> les outils</span></button>
        </div>
        <NavigationToolsList />
      </section>
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
.nav-inner { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; padding: 6px 12px; min-height: 56px; }

.brand { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; min-width: 44px; justify-self: start; color: var(--color-accent); text-decoration: none; }
.brand .logo { width: 19px; height: 27px; flex: none; }
.brand .bn { display: none; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.34em; text-transform: uppercase; color: var(--color-text); }
@media (min-width: 640px) { .brand .bn { display: inline; } }
.brand:hover .bn { color: var(--color-accent); }

.topnav { display: flex; align-items: center; gap: 2px; }
.sep { width: 1px; height: 12px; background: color-mix(in srgb, var(--color-muted) 55%, transparent); }
.top-btn {
  position: relative; display: inline-flex; align-items: center; min-height: 44px; padding: 0 12px;
  font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.3em; text-transform: uppercase; text-decoration: none;
  color: var(--color-text);
}
@media (min-width: 640px) { .top-btn { padding: 0 16px; letter-spacing: 0.34em; } }
.top-btn::after {
  content: ""; position: absolute; left: 12px; right: 12px; bottom: 8px; height: 1px; background: var(--color-accent);
  transform: scaleX(0); transition: transform 0.4s;
}
.top-btn:hover, .top-btn[aria-expanded="true"], .top-btn[aria-current] { color: var(--color-accent); }
.top-btn:hover::after, .top-btn[aria-expanded="true"]::after, .top-btn[aria-current]::after { transform: scaleX(1); }

/* panneaux déroulants centrés sous l'en-tête, comme sur l'accueil */
.nav-backdrop { position: fixed; inset: 0; z-index: 55; }
.panel {
  position: fixed; left: 50%; top: 60px; transform: translateX(-50%); z-index: 56;
  width: min(332px, calc(100vw - 28px)); max-height: calc(100vh - 76px); overflow-y: auto; padding: 0 0 8px;
  background: var(--color-bg); color: var(--color-text);
  border: 1px solid color-mix(in srgb, var(--color-accent) 35%, transparent); border-radius: 18px;
  box-shadow: 0 18px 48px color-mix(in srgb, var(--color-text) 22%, transparent);
}
.drop-enter-active { transition: opacity 0.22s ease-out, transform 0.22s ease-out; }
.drop-leave-active { transition: opacity 0.15s ease-in, transform 0.15s ease-in; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translate(-50%, -6px); }

.panel-head {
  display: flex; align-items: center; justify-content: space-between; padding: 8px 10px 8px 18px; margin-bottom: 6px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 22%, transparent);
}
.panel-eyebrow { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-muted); }
.panel-close {
  min-height: 44px; padding: 0 12px; border-radius: 999px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--color-text);
}
.panel-close:hover { color: var(--color-accent); }

.steps { list-style: none; margin: 0; padding: 0 8px; display: flex; flex-direction: column; gap: 2px; }
.step { padding: 6px 6px 4px; border-radius: 14px; }
.step.is-active { background: color-mix(in srgb, var(--color-accent) 9%, transparent); box-shadow: inset 3px 0 0 var(--color-accent); }
.step-h { display: flex; align-items: baseline; gap: 12px; margin: 0; padding: 0 6px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-muted); }
.step.is-active .step-h { color: var(--color-accent); }
.step-n { color: var(--color-accent); letter-spacing: 0.06em; }
.step-links { list-style: none; margin: 0; padding: 0 0 0 34px; }
.lnk {
  display: flex; align-items: center; min-height: 44px; padding: 0 8px; border-radius: 10px; text-decoration: none;
  font-family: var(--font-mono); font-size: 15px; color: var(--color-text);
}
.lnk:hover { background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
.lnk.is-active { color: var(--color-accent); text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 5px; }
.here { margin: -4px 0 6px; padding: 0 8px; font-family: var(--font-mono); font-size: 12px; color: var(--color-muted); }

@media (prefers-reduced-motion: reduce) {
  .drop-enter-active, .drop-leave-active, .top-btn::after { transition: none; }
}
</style>
