<script setup lang="ts">
import { useProjectsStore, type Project } from "~/stores/projects";

useHead({ title: "Les Sentiers — Projets | Adrien Neyron" });

// Chargement côté serveur : les projets sont dans le HTML initial (SEO, et
// lisibles même si le JavaScript échoue).
const store = useProjectsStore();
await store.fetchProjects();

// Filtres construits à partir des catégories réellement présentes
// (plus de catégories oubliées comme « SI » ou « Automatisation »).
const categories = computed(() => {
  const set = new Set<string>();
  store.projects.forEach((p: Project) => p.category && set.add(p.category));
  return ["Tous", ...Array.from(set)];
});
const activeFilter = ref("Tous");

const filtered = computed(() =>
  activeFilter.value === "Tous"
    ? store.projects
    : store.projects.filter((p: Project) => p.category === activeFilter.value)
);

const countLabel = computed(() => {
  const n = filtered.value.length;
  return `${n} sentier${n > 1 ? "s" : ""}${activeFilter.value !== "Tous" ? ` · ${activeFilter.value}` : ""}`;
});
</script>

<template>
  <div>
    <!-- En-tête sur fond de courbes de niveau -->
    <header class="relative overflow-hidden border-b border-(--color-accent)/15">
      <TrailContourBackground :seed="7" :cx="78" :cy="30" />
      <div class="relative max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 py-16 sm:py-24">
        <nav aria-label="Fil d'Ariane" class="font-mono text-xs text-(--color-muted) mb-6">
          <ol class="flex gap-2">
            <li><NuxtLink to="/" class="hover:underline">Camp de Base</NuxtLink></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Sentiers</li>
          </ol>
        </nav>
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-(--color-accent) mb-4">Sentiers · Projets</p>
        <h1 class="text-4xl sm:text-6xl leading-[1.02] text-(--color-text) max-w-3xl">
          Chaque projet est une trace, <em class="text-(--color-accent)">avec ses passages délicats.</em>
        </h1>
        <p class="mt-5 max-w-2xl text-base sm:text-lg text-(--color-muted) leading-relaxed">
          Missions en production et projets personnels. Pour chacun : le point de départ, les difficultés,
          l'itinéraire choisi et ce qui a changé à l'arrivée.
        </p>
      </div>
    </header>

    <div class="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 py-12 sm:py-16">
      <!-- Filtres -->
      <div class="flex flex-wrap items-center gap-2 mb-4" role="group" aria-label="Filtrer les sentiers par catégorie">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          :aria-pressed="activeFilter === cat"
          :class="[
            'px-4 py-2 min-h-[40px] rounded-full text-sm font-mono border transition-colors duration-200',
            activeFilter === cat
              ? 'bg-(--color-text) text-(--color-bg) border-(--color-text)'
              : 'bg-transparent text-(--color-text) border-(--color-muted)/50 hover:border-(--color-accent) hover:text-(--color-accent)',
          ]"
          @click="activeFilter = cat"
        >
          {{ cat }}
        </button>
      </div>
      <p class="font-mono text-xs text-(--color-muted) mb-8" aria-live="polite">{{ countLabel }}</p>

      <!-- Liste des sentiers — présentation des cartes d'origine (UiProjectCard) -->
      <ul v-if="filtered.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Sentiers">
        <li v-for="project in filtered" :key="project._id">
          <UiAnimatedSection class="h-full">
            <UiProjectCard
              :title="project.title"
              :role="project.role"
              :description="project.description"
              :technologies="project.technologies"
              :image-url="project.image?.light"
              :slug="project.slug || project._id"
              :difficulty="project.difficulty"
              :duration="project.duration"
              :tagline="project.tagline"
              :status="project.status"
              :impact="project.impact"
              :link="project.link"
              :code="project.code"
              :heading-level="2"
              :place="project.place"
              :coords="project.coords"
              :cover="project.cover"
            />
          </UiAnimatedSection>
        </li>
      </ul>

      <p v-else class="text-center py-20 text-(--color-muted)">
        Aucun sentier dans cette catégorie pour l'instant.
      </p>
    </div>
  </div>
</template>
