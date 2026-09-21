<script setup lang="ts">
import { ExternalLink, Github, Clock, ChevronRight } from "lucide-vue-next";

const props = defineProps<{
  title: string;
  role: string;
  description: string;
  technologies: string[];
  imageUrl?: string;
  link?: string;
  code?: string;
  slug?: string;
  difficulty?: "Débutant" | "Intermédiaire" | "Expert";
  duration?: string;
  tagline?: string;
  status?: "En production" | "En cours" | "Case study pro";
  impact?: string;
}>();

const statusClass: Record<string, string> = {
  "En production":  "bg-green-500/15 text-green-600 dark:text-green-400",
  "En cours":       "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  "Case study pro": "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

const difficultyClass: Record<string, string> = {
  Débutant:       "badge-debutant",
  Intermédiaire:  "badge-intermediaire",
  Expert:         "badge-expert",
};
</script>

<template>
  <article
    :aria-label="title"
    class="trail-card group flex flex-col overflow-hidden h-full"
  >
    <!-- Image -->
    <div class="relative w-full overflow-hidden bg-[var(--color-surface)]">
      <NuxtImg
        :src="imageUrl || '/projectsoon.png'"
        :alt="title"
        width="800"
        height="450"
        class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <!-- Difficulty badge -->
      <span
        v-if="difficulty"
        :class="['absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full', difficultyClass[difficulty]]"
      >
        {{ difficulty }}
      </span>
    </div>

    <!-- Content -->
    <div class="p-5 flex flex-col gap-3 flex-1">
      <div>
        <div class="flex items-start justify-between gap-2 flex-wrap">
          <h3 class="font-bold text-[var(--color-text)] text-base leading-snug">{{ title }}</h3>
          <span
            v-if="status"
            :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0', statusClass[status]]"
          >
            {{ status }}
          </span>
        </div>
        <p class="text-xs font-medium text-[var(--color-accent)] mt-0.5">{{ role }}</p>
        <p v-if="tagline" class="text-xs text-[var(--color-muted)] italic mt-1">{{ tagline }}</p>
      </div>

      <p class="text-sm text-[var(--color-text)]/70 leading-relaxed line-clamp-2">{{ description }}</p>

      <!-- Impact -->
      <div
        v-if="impact"
        class="text-xs font-semibold text-[var(--color-accent)] bg-[var(--color-accent)]/8 rounded-lg px-3 py-1.5"
      >
        {{ impact }}
      </div>

      <!-- Duration -->
      <div v-if="duration" class="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
        <Clock :size="11" aria-hidden="true" />
        {{ duration }}
      </div>

      <!-- Tech stack -->
      <div class="flex flex-wrap gap-1.5">
        <UiTechBadge
          v-for="tech in technologies.slice(0, 4)"
          :key="tech"
          :label="tech"
        />
        <span
          v-if="technologies.length > 4"
          class="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]"
        >
          +{{ technologies.length - 4 }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 mt-auto pt-2 border-t border-[var(--color-accent)]/10">
        <a
          v-if="code"
          :href="code"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          <Github :size="13" aria-hidden="true" />
          Code
        </a>

        <NuxtLink
          v-if="slug"
          :to="`/projects/${slug}`"
          class="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors ml-auto group/link"
        >
          Voir le projet
          <ChevronRight :size="13" aria-hidden="true" class="group-hover/link:translate-x-0.5 transition-transform" />
        </NuxtLink>
        <a
          v-else-if="link"
          :href="link"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors ml-auto"
        >
          Voir le projet
          <ExternalLink :size="13" aria-hidden="true" />
        </a>
      </div>
    </div>
  </article>
</template>
