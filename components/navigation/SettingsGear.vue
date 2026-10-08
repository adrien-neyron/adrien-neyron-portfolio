<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import { Settings, Volume2, VolumeX, Moon, Sun, Pause, Play } from "lucide-vue-next";
import { useColorMode } from "#imports";

const { isMuted }  = useBackgroundAudio();
const { isPaused } = useSceneState();
const colorMode    = useColorMode();
const isDark       = computed(() => colorMode.value === "dark");

const isOpen  = ref(false);
const rootRef = ref<HTMLElement | null>(null);

function toggleDark()  { colorMode.preference = isDark.value ? "light" : "dark"; }
function toggleAudio() { isMuted.value = !isMuted.value; }
function toggleScene() { isPaused.value = !isPaused.value; }

function onClickOutside(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) isOpen.value = false;
}

watch(isOpen, (open) => {
  if (!import.meta.client) return;
  if (open) document.addEventListener("mousedown", onClickOutside);
  else      document.removeEventListener("mousedown", onClickOutside);
});

onUnmounted(() => {
  if (import.meta.client) document.removeEventListener("mousedown", onClickOutside);
});
</script>

<template>
  <div ref="rootRef" class="settings-root">

    <!-- Déclencheur — roue dentée acier brossé -->
    <button
      class="gear-trigger"
      :aria-label="isOpen ? 'Fermer les réglages' : 'Réglages'"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <Settings
        :size="15"
        :stroke-width="1.5"
        class="gear-icon"
        :class="{ rotating: isOpen }"
        aria-hidden="true"
      />
    </button>

    <!-- Panneau déroulant glassmorphism -->
    <Transition
      enter-active-class="settings-enter-active"
      enter-from-class="settings-enter-from"
      enter-to-class="settings-enter-to"
      leave-active-class="settings-leave-active"
      leave-from-class="settings-leave-from"
      leave-to-class="settings-leave-to"
    >
      <div v-if="isOpen" class="settings-panel" role="menu">

        <!-- Son -->
        <button
          class="settings-item"
          :aria-pressed="!isMuted"
          :aria-label="isMuted ? 'Activer le son' : 'Couper le son'"
          role="menuitemcheckbox"
          :aria-checked="!isMuted"
          @click="toggleAudio"
        >
          <component
            :is="isMuted ? VolumeX : Volume2"
            :size="14"
            :stroke-width="1.5"
            class="item-icon"
            :class="{ active: !isMuted }"
            aria-hidden="true"
          />
          <span class="item-label">{{ isMuted ? "Son off" : "Son on" }}</span>
        </button>

        <!-- Mode nuit -->
        <button
          class="settings-item"
          :aria-pressed="isDark"
          :aria-label="isDark ? 'Passer en mode jour' : 'Passer en mode nuit'"
          role="menuitemcheckbox"
          :aria-checked="isDark"
          @click="toggleDark"
        >
          <component
            :is="isDark ? Moon : Sun"
            :size="14"
            :stroke-width="1.5"
            class="item-icon"
            :class="{ active: isDark }"
            aria-hidden="true"
          />
          <span class="item-label">{{ isDark ? "Nuit" : "Jour" }}</span>
        </button>

        <!-- Figer la scène -->
        <button
          class="settings-item"
          :aria-pressed="isPaused"
          :aria-label="isPaused ? 'Relancer la scène' : 'Figer la scène'"
          role="menuitemcheckbox"
          :aria-checked="isPaused"
          @click="toggleScene"
        >
          <component
            :is="isPaused ? Play : Pause"
            :size="14"
            :stroke-width="1.5"
            class="item-icon"
            :class="{ active: isPaused }"
            aria-hidden="true"
          />
          <span class="item-label">{{ isPaused ? "Relancer" : "Figer" }}</span>
        </button>

        <!-- Séparateur + Admin -->
        <div class="panel-separator" />
        <ClientOnly>
          <NavigationAdminNavButton class="settings-admin" />
        </ClientOnly>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ─── Conteneur ─── */
.settings-root {
  position: relative;
}

/* ─── Déclencheur ─── */
.gear-trigger {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(139, 155, 180, 0.22);
  background: rgba(139, 155, 180, 0.06);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: border-color 0.2s, background 0.2s;
}
.gear-trigger:hover {
  border-color: rgba(139, 155, 180, 0.45);
  background: rgba(139, 155, 180, 0.12);
}

.gear-icon {
  color: #8B9BB4;
  transition: transform 0.55s cubic-bezier(0.23, 1, 0.32, 1), color 0.2s;
}
.gear-icon.rotating {
  transform: rotate(72deg);
  color: #a8b8cc;
}

/* ─── Panneau ─── */
.settings-panel {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  min-width: 148px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-radius: 12px;
  border: 1px solid rgba(139, 155, 180, 0.14);
  background: rgba(14, 11, 8, 0.72);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
}

/* ─── Transitions panneau ─── */
.settings-enter-active { transition: opacity 0.2s ease-out, transform 0.2s ease-out; }
.settings-enter-from   { opacity: 0; transform: translateY(-6px) scale(0.96); }
.settings-enter-to     { opacity: 1; transform: translateY(0) scale(1); }
.settings-leave-active { transition: opacity 0.15s ease-in, transform 0.15s ease-in; }
.settings-leave-from   { opacity: 1; transform: translateY(0) scale(1); }
.settings-leave-to     { opacity: 0; transform: translateY(-4px) scale(0.97); }

/* ─── Item ─── */
.settings-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 7px;
  width: 100%;
  text-align: left;
  transition: background 0.15s;
}
.settings-item:hover {
  background: rgba(226, 109, 59, 0.07);
}

.item-icon {
  color: rgba(139, 155, 180, 0.6);
  flex-shrink: 0;
  transition: color 0.15s;
}
.item-icon.active { color: #E26D3B; }
.settings-item:hover .item-icon { color: #E26D3B; }

.item-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: rgba(240, 232, 216, 0.55);
  transition: color 0.15s;
}
.settings-item:hover .item-label { color: rgba(240, 232, 216, 0.9); }

/* ─── Séparateur ─── */
.panel-separator {
  height: 1px;
  background: rgba(139, 155, 180, 0.1);
  margin: 3px 0;
}

/* ─── Admin intégré ─── */
.settings-admin {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 7px;
  transition: background 0.15s;
}
.settings-admin:hover { background: rgba(226, 109, 59, 0.07); }
</style>
