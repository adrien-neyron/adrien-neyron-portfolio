<script setup lang="ts">
import { useProjectsStore, type Project } from "~/stores/projects";
import { useStagesStore } from "~/stores/stages";
import { useProfileStore } from "~/stores/profile";
import { buildStageView, isListedProject, projectType, stageHeading, stageOfProject } from "~/utils/stages";

useHead({ title: "Les Sentiers — Projets | Adrien Neyron" });

// Chargement côté serveur : projets, étapes et bandeau sont dans le HTML initial (SEO, et
// lisibles même si le JavaScript échoue).
const store = useProjectsStore();
const stagesStore = useStagesStore();
const profileStore = useProfileStore();
await Promise.all([store.fetchProjects(), stagesStore.fetchStages(), profileStore.fetchProfile()]);

const slugOf = (p: Pick<Project, "slug" | "_id">) => p.slug || p._id;

// Étapes de la trace : même calcul que l'accueil (numéro, nom, résultat clé)
const stageView = computed(() =>
  buildStageView(stagesStore.stages, store.projects.map((p) => ({ slug: slugOf(p), title: p.title })))
);

// Bandeau de chiffres (admin › Profil) : un chiffre sans valeur n'est jamais affiché
const trailStats = computed(() => (profileStore.profile.trailStats ?? []).filter((s) => s.value?.trim()));

// Fiches publiées : un type (mission / perso) et défi, solution, résultat renseignés (utils/stages.ts).
// Ordre : du plus récent au plus ancien sur la trace ; hors trace, à la fin.
const listed = computed(() =>
  store.projects
    .filter((p) => isListedProject({ ...p, slug: slugOf(p) }))
    .map((p) => ({ p, st: stageOfProject(slugOf(p), stageView.value), type: projectType({ ...p, slug: slugOf(p) }) }))
    .sort((a, b) => (b.st?.order ?? -1) - (a.st?.order ?? -1))
);

const FILTERS = [
  { value: "tous", label: "Tous" },
  { value: "mission", label: "Missions" },
  { value: "perso", label: "Projets perso" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];
const activeFilter = ref<Filter>("tous");

const filtered = computed(() =>
  activeFilter.value === "tous" ? listed.value : listed.value.filter((x) => x.type === activeFilter.value)
);

const countLabel = computed(() => {
  const n = filtered.value.length;
  const f = FILTERS.find((x) => x.value === activeFilter.value)!;
  return `${n} sentier${n > 1 ? "s" : ""}${activeFilter.value !== "tous" ? ` · ${f.label}` : ""}`;
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
            <li><NuxtLink to="/" class="hover:underline">Accueil</NuxtLink></li>
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
        <!-- Bandeau de chiffres (éditable dans /admin › Profil) -->
        <dl v-if="trailStats.length" class="trail-stats mt-10 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 max-w-4xl">
          <div v-for="s in trailStats" :key="s.value + s.label" class="flex flex-col-reverse gap-1">
            <dt class="text-sm text-(--color-muted) leading-snug">{{ s.label }}</dt>
            <dd class="text-3xl sm:text-4xl text-(--color-text)" style="font-family: var(--font-title);">{{ s.value }}</dd>
          </div>
        </dl>
      </div>
    </header>

    <div class="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 py-12 sm:py-16">
      <!-- Filtres -->
      <div class="flex flex-wrap items-center gap-2 mb-4" role="group" aria-label="Filtrer les sentiers : missions ou projets perso">
        <button
          v-for="f in FILTERS"
          :key="f.value"
          type="button"
          :aria-pressed="activeFilter === f.value"
          :class="[
            'px-4 py-2 min-h-11 rounded-full text-sm font-mono border transition-colors duration-200',
            activeFilter === f.value
              ? 'bg-(--color-text) text-(--color-bg) border-(--color-text)'
              : 'bg-transparent text-(--color-text) border-(--color-muted) hover:border-(--color-accent) hover:text-(--color-accent)',
          ]"
          @click="activeFilter = f.value"
        >
          {{ f.label }}
        </button>
      </div>
      <p class="font-mono text-xs text-(--color-muted) mb-8" aria-live="polite">{{ countLabel }}</p>

      <!-- Liste des sentiers — présentation des cartes d'origine (UiProjectCard) -->
      <ul v-if="filtered.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Sentiers">
        <li v-for="{ p: project, st } in filtered" :key="project._id">
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
              :stage="st ? stageHeading(st) : undefined"
              :key-result="st?.keyResult || undefined"
            />
          </UiAnimatedSection>
        </li>
      </ul>

      <p v-else class="text-center py-20 text-(--color-muted)">
        Aucun sentier de ce type pour l'instant.
      </p>
    </div>
  </div>
</template>
