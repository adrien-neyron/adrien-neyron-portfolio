<script setup lang="ts">
import { ArrowLeft, ArrowRight, Clock, ExternalLink, Github } from "lucide-vue-next";
import { projects } from "~/data/projects";

const route = useRoute();

const project = computed(() =>
  projects.find((p) => p.id === route.params.id)
);

const currentIndex = computed(() =>
  projects.findIndex((p) => p.id === route.params.id)
);

const nextProject = computed(() =>
  projects[(currentIndex.value + 1) % projects.length]
);

if (!project.value) {
  throw createError({ statusCode: 404, message: "Projet introuvable" });
}

useHead({
  title: computed(() => `${project.value?.title ?? "Projet"} | Adrien Neyron`),
});

const difficultyClass: Record<string, string> = {
  Débutant:       "badge-debutant",
  Intermédiaire:  "badge-intermediaire",
  Expert:         "badge-expert",
};
</script>

<template>
  <div v-if="project" class="min-h-screen py-20 px-6 sm:px-12 lg:px-20">
    <div class="max-w-4xl mx-auto">

      <!-- Retour -->
      <UiAnimatedSection>
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors mb-8 group"
        >
          <ArrowLeft :size="14" aria-hidden="true" class="group-hover:-translate-x-0.5 transition-transform" />
          Retour aux sentiers
        </NuxtLink>
      </UiAnimatedSection>

      <!-- Hero projet -->
      <UiAnimatedSection>
        <div class="mb-10">
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <span
              v-if="project.difficulty"
              :class="['text-xs font-bold px-3 py-1 rounded-full', difficultyClass[project.difficulty]]"
            >
              {{ project.difficulty }}
            </span>
            <span class="text-xs text-[var(--color-muted)] bg-[var(--color-surface)] px-3 py-1 rounded-full border border-[var(--color-accent)]/15">
              {{ project.category }}
            </span>
            <span v-if="project.duration" class="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
              <Clock :size="11" aria-hidden="true" />
              {{ project.duration }}
            </span>
          </div>

          <h1 class="text-3xl sm:text-5xl font-bold text-[var(--color-text)] mb-3">
            {{ project.title }}
          </h1>
          <p class="text-[var(--color-accent)] text-sm italic">{{ project.tagline }}</p>
        </div>
      </UiAnimatedSection>

      <!-- Image bannière -->
      <UiAnimatedSection>
        <div class="rounded-2xl overflow-hidden mb-12 border border-[var(--color-accent)]/15">
          <NuxtImg
            :src="project.image.light || '/projectsoon.png'"
            :alt="project.title"
            width="1200"
            height="600"
            class="w-full h-56 sm:h-80 object-cover"
          />
        </div>
      </UiAnimatedSection>

      <!-- Narration — 3 colonnes -->
      <UiAnimatedSection>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div class="trail-card p-6">
            <h2 class="text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest mb-3">Le Défi</h2>
            <p class="text-sm text-[var(--color-text)]/80 leading-relaxed">{{ project.challenge }}</p>
          </div>
          <div class="trail-card p-6">
            <h2 class="text-xs font-mono text-[var(--color-secondary)] uppercase tracking-widest mb-3">La Solution</h2>
            <p class="text-sm text-[var(--color-text)]/80 leading-relaxed">{{ project.solution }}</p>
          </div>
          <div class="trail-card p-6">
            <h2 class="text-xs font-mono text-[var(--color-highlight)] uppercase tracking-widest mb-3">Le Résultat</h2>
            <p class="text-sm text-[var(--color-text)]/80 leading-relaxed">{{ project.result }}</p>
          </div>
        </div>
      </UiAnimatedSection>

      <!-- Stack technique -->
      <UiAnimatedSection>
        <div class="mb-10">
          <h2 class="text-sm font-semibold text-[var(--color-text)] mb-3">Stack technique</h2>
          <div class="flex flex-wrap gap-2">
            <UiTechBadge
              v-for="tech in project.technologies"
              :key="tech"
              :label="tech"
              variant="featured"
            />
          </div>
        </div>
      </UiAnimatedSection>

      <!-- Liens -->
      <UiAnimatedSection>
        <div
          v-if="project.code || project.link"
          class="flex gap-4 mb-16"
        >
          <a
            v-if="project.code"
            :href="project.code"
            target="_blank"
            rel="noopener noreferrer"
            class="button-empty px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"
          >
            <Github :size="16" aria-hidden="true" />
            Voir le code
          </a>
          <a
            v-if="project.link"
            :href="project.link"
            target="_blank"
            rel="noopener noreferrer"
            class="button-accent px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"
          >
            <ExternalLink :size="16" aria-hidden="true" />
            Voir le site
          </a>
        </div>
      </UiAnimatedSection>

      <!-- Prochaine étape -->
      <UiAnimatedSection>
        <div class="border-t border-[var(--color-accent)]/15 pt-10">
          <p class="text-xs font-mono text-[var(--color-muted)] uppercase tracking-widest mb-4">Prochaine étape</p>
          <NuxtLink
            :to="`/projects/${nextProject.id}`"
            class="trail-card p-5 flex items-center justify-between group"
          >
            <div>
              <p class="font-semibold text-[var(--color-text)]">{{ nextProject.title }}</p>
              <p class="text-xs text-[var(--color-muted)] mt-0.5">{{ nextProject.tagline }}</p>
            </div>
            <ArrowRight
              :size="20"
              class="text-[var(--color-accent)] group-hover:translate-x-1 transition-transform shrink-0"
              aria-hidden="true"
            />
          </NuxtLink>
        </div>
      </UiAnimatedSection>

    </div>
  </div>
</template>
