<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

const { isMuted } = useBackgroundAudio();
const audioEl     = ref<HTMLAudioElement | null>(null);
const isDark      = ref(false);

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

// Démarre la lecture au premier désactivage du mute
watch(isMuted, (muted) => {
  const audio = audioEl.value;
  if (!audio) return;
  if (!muted) audio.play().catch(() => {});
  audio.muted = muted;
});

// Recharge la piste quand le thème change
watch(audioSrc, (src) => {
  const audio = audioEl.value;
  if (!audio) return;
  audio.src = src;
  if (!isMuted.value) audio.play().catch(() => {});
});
</script>

<template>
  <audio ref="audioEl" :src="audioSrc" loop :muted="isMuted" />
</template>
