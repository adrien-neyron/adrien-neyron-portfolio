<script setup lang="ts">
import { MapPin } from "lucide-vue-next";
import resume  from "~/data/resume.json";
import tooltip from "~/data/tooltip.json";
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row justify-between items-center md:items-stretch mt-20 px-8 sm:px-6 lg:px-12 gap-12 md:gap-0">

    <!-- Colonne gauche — headline créatif -->
    <div class="flex-[2] flex flex-col justify-center items-start">
      <h1 class="flex flex-col text-left leading-none gap-2 sm:gap-3">
        <span class="text-lg sm:text-2xl lg:text-3xl font-medium text-accent tracking-wide">
          Athlete's
        </span>

        <span class="flex items-center flex-wrap">
          <UiTooltipWrapper :text="tooltip.mindset">
            <span class="text-4xl sm:text-6xl lg:text-8xl font-bold text-black dark:text-white">
              <UiTextDecrypt text="MINDSET" />
            </span>
          </UiTooltipWrapper>
          <span class="text-3xl sm:text-5xl lg:text-7xl font-medium text-accent relative lg:top-3 -left-1 sm:-left-2 lg:-left-3">
            &amp;
          </span>
        </span>

        <span class="flex items-center flex-wrap">
          <span class="text-4xl sm:text-6xl lg:text-8xl font-bold text-black dark:text-white">
            <UiTextDecrypt text="DEVELOPER" />
          </span>
          <span class="text-base sm:text-xl lg:text-2xl font-medium text-accent relative lg:top-3 -left-1 sm:-left-2 lg:-left-3">
            's skills
          </span>
        </span>
      </h1>

      <!-- Localisation + expérience -->
      <div class="flex items-center gap-2 mt-6 text-sm text-gray-500 dark:text-gray-400">
        <MapPin :size="14" />
        <span>{{ resume.basics.summary }}</span>
        <span class="w-px h-3 bg-gray-300 dark:bg-gray-600" />
        <span>17 ans d'expérience</span>
      </div>
    </div>

    <!-- Colonne droite — value proposition + CTA -->
    <div class="flex-1 flex flex-col justify-center gap-6">

      <!-- Accroche -->
      <div>
        <div class="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-accent mb-3">
          {{ resume.basics.job1 }}
        </div>
        <p class="text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-md">
          {{ resume.basics.job2 }}
        </p>
      </div>

      <!-- Badges tech -->
      <div class="flex flex-wrap gap-2">
        <span
          v-for="tech in ['Vue.js', 'Nuxt', 'Node.js', 'TypeScript']"
          :key="tech"
          class="text-xs font-medium px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
        >
          {{ tech }}
        </span>
      </div>

      <!-- CTAs -->
      <div class="flex flex-wrap gap-4">
        <UiTooltipWrapper :text="tooltip.projectsButton">
          <a
            href="#works"
            class="relative overflow-hidden w-44 px-6 py-3 rounded-2xl font-semibold shadow-md button-accent text-white group flex items-center justify-center"
          >
            <span class="scroll-text-container w-full h-full flex items-center justify-center overflow-hidden">
              <span class="scroll-text">
                See my projects&nbsp;&nbsp;&nbsp;&nbsp;See my projects&nbsp;&nbsp;&nbsp;&nbsp;See my projects
              </span>
            </span>
          </a>
        </UiTooltipWrapper>

        <a
          href="#contact"
          class="button-empty px-6 py-3 rounded-2xl font-semibold transition hover:text-white"
        >
          Contact me
        </a>
      </div>

      <!-- Disponibilité -->
      <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span class="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Disponible pour de nouveaux projets
      </div>
    </div>
  </div>
</template>
