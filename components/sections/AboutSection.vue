<script setup lang="ts">
import { Download } from "lucide-vue-next";
import { useProfileStore } from "~/stores/profile";

const profileStore = useProfileStore();
profileStore.fetchProfile();

const greetings = "HELLO. I'M ADRIEN, WELCOME THERE!";

const hovered       = ref(false);
const reducedMotion = ref(false);

onMounted(() => {
  reducedMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
});
</script>

<template>
  <section id="about" class="min-h-screen flex items-center justify-center py-20">
    <div
      v-motion
      :initial="{ opacity: 0, y: 50 }"
      :visible="{ opacity: 1, y: 0, transition: { duration: 800 } }"
      class="w-[90%] max-w-5xl mx-auto bg-white/70 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-3xl shadow-xl flex flex-col md:flex-row items-center overflow-hidden"
    >
      <!-- Image interactive -->
      <div
        v-motion
        :initial="{ opacity: 0, x: -60 }"
        :visible="{ opacity: 1, x: 0, transition: { duration: 800, delay: 200 } }"
        class="relative w-72 h-72 md:w-96 md:h-96 m-6 cursor-pointer flex items-center justify-center"
        @mouseenter="hovered = true"
        @mouseleave="hovered = false"
      >
        <!-- Sculpture -->
        <div class="absolute inset-0 flex items-center justify-center">
          <h2 class="absolute text-xl md:text-2xl font-bold text-gray-600 dark:text-gray-300/80 tracking-wider select-none pointer-events-none">
            <span class="text-accent text-8xl">?</span>
          </h2>
          <NuxtImg
            src="/sculpture.png"
            alt="Sculpture"
            class="w-full h-full object-contain rounded-xl shadow-lg border border-white/30"
            placeholder
          />
        </div>

        <!-- Profil au hover -->
        <Transition
          enter-active-class="transition-all duration-500 ease-in-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-105"
          leave-active-class="transition-all duration-500 ease-in-out"
          leave-from-class="opacity-100 scale-105"
          leave-to-class="opacity-0 scale-95"
        >
          <div v-if="hovered" class="absolute inset-0">
            <NuxtImg
              :src="profileStore.profile.pictureUrl"
              alt="Photo de profil d'Adrien"
              class="w-full h-full object-cover rounded-xl shadow-xl border border-white/40"
              placeholder
            />
          </div>
        </Transition>
      </div>

      <!-- Texte -->
      <div
        v-motion
        :initial="{ opacity: 0, x: 60 }"
        :visible="{ opacity: 1, x: 0, transition: { duration: 800, delay: 300 } }"
        class="flex-1 flex flex-col text-center md:text-left px-6 py-12 md:py-16 space-y-6"
      >
        <h2 class="text-2xl md:text-3xl font-semibold text-accent font-mono">
          <UiTextDecrypt :text="greetings" />
        </h2>

        <div class="space-y-4 text-gray-800 dark:text-gray-200 text-sm md:text-base">
          <p
            v-for="(paragraph, index) in profileStore.profile.about"
            :key="index"
            class="leading-relaxed"
          >
            <span
              v-for="(word, i) in paragraph.split(' ')"
              :key="i"
              :class="['inline-block cursor-default px-0.5', !reducedMotion && 'transition-transform duration-150 hover:scale-110 hover:text-[#f6c453]']"
            >
              {{ word }}&nbsp;
            </span>
          </p>
        </div>

        <a
          v-if="profileStore.profile.cvUrl"
          :href="profileStore.profile.cvUrl"
          target="_blank"
          rel="noopener"
          download
          class="button-empty inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm w-fit self-center md:self-start transition hover:text-white"
        >
          <Download :size="16" aria-hidden="true" />
          Télécharger mon CV
        </a>
      </div>
    </div>
  </section>
</template>
