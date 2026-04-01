<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { Volume2, VolumeX } from "lucide-vue-next";

const isMuted    = ref(true);
const position   = ref({ x: 20, y: 100 });
const audioEl    = ref<HTMLAudioElement | null>(null);
const isDragging = ref(false);
const isDark     = ref(false);

// Dark mode sans #imports — observe la classe html
onMounted(() => {
  isDark.value = document.documentElement.classList.contains("dark");
  const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains("dark");
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  onUnmounted(() => observer.disconnect());
});

const audioSrc = computed(() =>
  isDark.value ? "/FEU_DE_CHEMINEE.mp3" : "/NATURE.mp3"
);

function toggleSound() {
  const audio = audioEl.value;
  if (!audio) return;
  if (audio.paused) audio.play();
  audio.muted = !audio.muted;
  isMuted.value = audio.muted;
}

function clamp(x: number, y: number) {
  const size = 50;
  return {
    x: Math.min(Math.max(x, 0), window.innerWidth  - size),
    y: Math.min(Math.max(y, 0), window.innerHeight - size),
  };
}

// --- Mouse drag ---
function onMouseMove(e: MouseEvent) {
  isDragging.value = true;
  position.value = clamp(e.clientX - 25, e.clientY - 25);
}
function onMouseUp() {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup",   onMouseUp);
  if (!isDragging.value) toggleSound();
  isDragging.value = false;
}
function onMouseDown(e: MouseEvent) {
  e.preventDefault();
  isDragging.value = false;
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup",   onMouseUp);
}

// --- Touch drag ---
function onTouchMove(e: TouchEvent) {
  isDragging.value = true;
  position.value = clamp(e.touches[0].clientX - 25, e.touches[0].clientY - 25);
}
function onTouchEnd() {
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend",  onTouchEnd);
  if (!isDragging.value) toggleSound();
  isDragging.value = false;
}
function onTouchStart(e: TouchEvent) {
  e.preventDefault();
  isDragging.value = false;
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend",  onTouchEnd);
}

// --- Resize clamp ---
onMounted(() => {
  const onResize = () => { position.value = clamp(position.value.x, position.value.y); };
  window.addEventListener("resize", onResize);
  onUnmounted(() => window.removeEventListener("resize", onResize));
});

// --- Reload music on theme change ---
watch(audioSrc, (src) => {
  const audio = audioEl.value;
  if (!audio) return;
  audio.src = src;
  if (!isMuted.value) audio.play().catch(() => {});
});
</script>

<template>
  <div class="contents">
    <audio ref="audioEl" :src="audioSrc" loop :muted="isMuted" />

    <div
      class="fixed z-50"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    >
      <button
        :aria-label="isMuted ? 'Activer la musique d\'ambiance' : 'Désactiver la musique d\'ambiance'"
        :aria-pressed="!isMuted"
        class="group relative w-12 h-12 flex items-center justify-center rounded-full bg-black/70 text-white shadow-lg active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
        @mousedown="onMouseDown"
        @touchstart.prevent="onTouchStart"
        @click="toggleSound"
      >
        <VolumeX v-if="isMuted" :size="20" aria-hidden="true" />
        <Volume2 v-else         :size="20" aria-hidden="true" />

        <!-- Tooltip décoratif -->
        <svg
          aria-hidden="true"
          class="absolute w-20 h-20 -top-4 -left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          viewBox="0 0 100 100"
        >
          <defs>
            <path id="circlePath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
          </defs>
          <text fill="white" font-size="25" font-weight="bold">
            <textPath href="#circlePath" startOffset="50%" text-anchor="middle">Move It</textPath>
          </text>
        </svg>
      </button>
    </div>
  </div>
</template>
