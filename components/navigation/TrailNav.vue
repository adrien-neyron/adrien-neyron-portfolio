<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";

const route   = useRoute();
const isOpen  = ref(false);

// Étapes topographiques de l'expédition
const stages = [
  { path: "/",          label: "Se repérer",  num: "01" },
  { path: "/projects",  label: "Monter",       num: "02" },
  { path: "/carnet",    label: "Persévérer",   num: "03" },
  { path: "/ai-tools",  label: "S'équiper",    num: "04" },
  { path: "/contact",   label: "Se poser",     num: "05" },
];

function isActive(path: string) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

function ariaCurrent(path: string): "page" | "true" | undefined {
  if (!isActive(path)) return undefined;
  return route.path === path ? "page" : "true";
}

// Bloque le scroll du body quand le tiroir est ouvert
watch(isOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? "hidden" : "";
});
onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = "";
});

// Ferme au changement de page
watch(() => route.path, () => { isOpen.value = false; });

// Barre de progression au scroll
onMounted(() => {
  if (!import.meta.client) return;
  const onScroll = () => {
    const bar   = document.getElementById("scroll-progress");
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = total > 0 ? `${(window.scrollY / total) * 100}%` : "0%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onUnmounted(() => window.removeEventListener("scroll", onScroll));
});
</script>

<template>
  <!-- Gestionnaire audio invisible -->
  <BackgroundMusic />

  <header role="banner" class="nav-header">
    <div class="nav-inner">

      <!-- GAUCHE — Réglages système -->
      <NavigationSettingsGear />

      <!-- CENTRE — Identité (lien discret vers l'accueil) -->
      <NuxtLink to="/" class="identity" aria-label="Retour à l'accueil">
        Adrien Neyron
      </NuxtLink>

      <!-- DROITE — Burger topographique -->
      <button
        class="topo-burger"
        :aria-label="isOpen ? 'Fermer la navigation' : 'Navigation'"
        :aria-expanded="isOpen"
        @click="isOpen = !isOpen"
      >
        <template v-if="!isOpen">
          <span class="topo-line l1" aria-hidden="true" />
          <span class="topo-line l2" aria-hidden="true" />
          <span class="topo-line l3" aria-hidden="true" />
        </template>
        <template v-else>
          <span class="x-bar x1" aria-hidden="true" />
          <span class="x-bar x2" aria-hidden="true" />
        </template>
      </button>

    </div>

    <!-- Barre de progression -->
    <div aria-hidden="true" class="progress-track">
      <div id="scroll-progress" class="progress-fill" />
    </div>
  </header>

  <!-- Tiroir de navigation — téléporté hors du header -->
  <Teleport to="body">

    <!-- Fond semi-opaque (clic pour fermer) -->
    <Transition name="overlay">
      <div
        v-if="isOpen"
        class="nav-backdrop"
        aria-hidden="true"
        @click="isOpen = false"
      />
    </Transition>

    <!-- Tiroir latéral droit -->
    <Transition name="drawer">
      <nav
        v-if="isOpen"
        aria-label="Navigation principale"
        class="nav-drawer"
      >
        <!-- En-tête tiroir -->
        <div class="drawer-head">
          <span class="drawer-eyebrow">Expédition</span>
          <button
            class="drawer-close"
            aria-label="Fermer la navigation"
            @click="isOpen = false"
          >
            <span class="x-bar x1" aria-hidden="true" />
            <span class="x-bar x2" aria-hidden="true" />
          </button>
        </div>

        <!-- Étapes -->
        <ol class="stages" role="list">
          <li
            v-for="(stage, i) in stages"
            :key="stage.path"
            :style="{ '--i': i }"
          >
            <NuxtLink
              :to="stage.path"
              :aria-current="ariaCurrent(stage.path)"
              :class="['stage-link', { 'is-active': isActive(stage.path) }]"
            >
              <span class="stage-num" aria-hidden="true">{{ stage.num }}</span>
              <span class="stage-label">{{ stage.label }}</span>
              <span
                v-if="isActive(stage.path)"
                class="stage-dot"
                aria-hidden="true"
              />
            </NuxtLink>
          </li>
        </ol>

        <!-- Pied du tiroir -->
        <div class="drawer-foot">
          <span class="foot-sig">Dev · Trail · Formation</span>
        </div>
      </nav>
    </Transition>

  </Teleport>
</template>

<style scoped>
/* ─── Header ─── */
.nav-header {
  position: fixed;
  top: 0; left: 0;
  width: 100%;
  z-index: 50;
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
}

/* ─── Identité centrale ─── */
.identity {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(240, 232, 216, 0.32);
  transition: color 0.25s;
  text-decoration: none;
}
.identity:hover { color: rgba(240, 232, 216, 0.7); }

/* ─── Burger topographique (3 lignes courbes de niveau) ─── */
.topo-burger {
  width: 36px;
  height: 36px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 0;
  position: relative;
  border-radius: 8px;
  border: 1px solid rgba(226, 109, 59, 0.18);
  background: rgba(226, 109, 59, 0.04);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: border-color 0.2s, background 0.2s;
}
.topo-burger:hover {
  border-color: rgba(226, 109, 59, 0.42);
  background: rgba(226, 109, 59, 0.08);
}

/* Lignes de niveau cuivrées */
.topo-line {
  display: block;
  height: 1.5px;
  background: #E26D3B;
  border-radius: 2px;
  position: absolute;
  right: 8px;
  transition: opacity 0.25s, transform 0.25s;
}
.l1 { width: 20px; top: 10px; opacity: 1.00; }
.l2 { width: 14px; top: 17px; opacity: 0.60; }
.l3 { width:  8px; top: 24px; opacity: 0.30; }

/* Micro-dérive au survol — effet terrain ondulé */
.topo-burger:hover .l1 { transform: translateX(-2px); }
.topo-burger:hover .l2 { transform: translateX( 2px); }
.topo-burger:hover .l3 { transform: translateX(-1px); }

/* Croix — quand ouvert */
.x-bar {
  display: block;
  height: 1.5px;
  border-radius: 2px;
  position: absolute;
}
/* Croix dans le burger */
.topo-burger .x-bar {
  width: 18px;
  background: rgba(240, 232, 216, 0.55);
}
.topo-burger .x1 { transform: rotate( 45deg); }
.topo-burger .x2 { transform: rotate(-45deg); }

/* ─── Barre de progression ─── */
.progress-track {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 1px;
}
.progress-fill {
  height: 100%;
  width: 0;
  transition: width 0.1s linear;
  background: #E26D3B;
}

/* ─── Backdrop ─── */
.nav-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(8, 6, 4, 0.55);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}
.overlay-enter-active { transition: opacity 0.3s ease-out; }
.overlay-enter-from   { opacity: 0; }
.overlay-enter-to     { opacity: 1; }
.overlay-leave-active { transition: opacity 0.22s ease-in; }
.overlay-leave-from   { opacity: 1; }
.overlay-leave-to     { opacity: 0; }

/* ─── Tiroir ─── */
.nav-drawer {
  position: fixed;
  right: 0; top: 0; bottom: 0;
  width: min(300px, 100vw);
  z-index: 41;
  display: flex;
  flex-direction: column;
  padding: 22px 20px;
  background: rgba(12, 9, 6, 0.90);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border-left: 1px solid rgba(226, 109, 59, 0.10);
}
.drawer-enter-active { transition: transform 0.35s cubic-bezier(0.23, 1, 0.32, 1); }
.drawer-enter-from   { transform: translateX(100%); }
.drawer-enter-to     { transform: translateX(0); }
.drawer-leave-active { transition: transform 0.25s cubic-bezier(0.55, 0, 1, 0.45); }
.drawer-leave-from   { transform: translateX(0); }
.drawer-leave-to     { transform: translateX(100%); }

/* ─── En-tête du tiroir ─── */
.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 48px;
}

.drawer-eyebrow {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(226, 109, 59, 0.45);
}

.drawer-close {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  border-radius: 6px;
  transition: background 0.15s;
}
.drawer-close:hover { background: rgba(255, 255, 255, 0.05); }
.drawer-close .x-bar {
  width: 14px;
  background: rgba(240, 232, 216, 0.35);
  transition: background 0.15s;
}
.drawer-close:hover .x-bar { background: rgba(240, 232, 216, 0.75); }

/* ─── Étapes ─── */
.stages {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  list-style: none;
  margin: 0; padding: 0;
}

.stage-link {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 13px 10px;
  border-radius: 10px;
  text-decoration: none;
  transition: background 0.2s;
  animation: stageIn 0.4s ease-out both;
  animation-delay: calc(var(--i) * 55ms + 80ms);
  position: relative;
}
.stage-link:hover,
.stage-link.is-active {
  background: rgba(226, 109, 59, 0.06);
}

@keyframes stageIn {
  from { opacity: 0; transform: translateX(14px); }
  to   { opacity: 1; transform: translateX(0); }
}

.stage-num {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: rgba(226, 109, 59, 0.40);
  flex-shrink: 0;
  transition: color 0.2s;
  line-height: 1;
}
.stage-link:hover .stage-num,
.stage-link.is-active .stage-num { color: #E26D3B; }

.stage-label {
  font-family: var(--font-title);
  font-size: 28px;
  line-height: 1;
  color: rgba(240, 232, 216, 0.45);
  transition: color 0.2s;
}
.stage-link:hover .stage-label,
.stage-link.is-active .stage-label { color: rgba(240, 232, 216, 0.95); }

.stage-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #E26D3B;
  flex-shrink: 0;
  align-self: center;
  margin-left: auto;
}

/* ─── Pied du tiroir ─── */
.drawer-foot {
  padding-top: 20px;
  border-top: 1px solid rgba(226, 109, 59, 0.07);
}
.foot-sig {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.12em;
  color: rgba(240, 232, 216, 0.15);
}
</style>
