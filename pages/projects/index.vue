<script setup lang="ts">
import { MapPin, Filter } from "lucide-vue-next";
import { useProjectsStore, type Project } from "~/stores/projects";

useHead({ title: "Les Sentiers — Projets | Adrien Neyron" });

const store = useProjectsStore();
onMounted(() => store.fetchProjects());

const categories = ["Tous", "E-commerce", "Outil métier", "LMS", "IA"] as const;
type Category = typeof categories[number];
const activeFilter = ref<Category>("Tous");

const filtered = computed(() =>
  activeFilter.value === "Tous"
    ? store.projects
    : store.projects.filter((p: Project) => p.category === activeFilter.value)
);
</script>

<template>
  <div class="min-h-screen py-20 px-6 sm:px-12 lg:px-20">
    <div class="max-w-6xl mx-auto">

      <!-- Header -->
      <UiAnimatedSection>
        <div class="mb-12">
          <div class="flex items-center gap-2 mb-3">
            <MapPin :size="16" class="text-[var(--color-accent)]" aria-hidden="true" />
            <span class="text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest">Carte des réalisations</span>
          </div>
          <h1 class="text-3xl sm:text-5xl font-bold text-[var(--color-text)] mb-3">
            Les Sentiers
          </h1>
          <p class="text-[var(--color-muted)] max-w-xl leading-relaxed text-sm sm:text-base">
            Chaque projet est une trace — une ascension avec ses défis, ses choix techniques et sa vue au sommet.
          </p>
        </div>
      </UiAnimatedSection>

      <!-- Filtres -->
      <UiAnimatedSection>
        <div class="flex items-center gap-2 mb-8 flex-wrap" role="group" aria-label="Filtrer les projets">
          <Filter :size="14" class="text-[var(--color-muted)] shrink-0" aria-hidden="true" />
          <button
            v-for="cat in categories"
            :key="cat"
            :class="[
              'px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
              activeFilter === cat
                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                : 'bg-transparent text-[var(--color-muted)] border-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]',
            ]"
            @click="activeFilter = cat"
          >
            {{ cat }}
          </button>
        </div>
      </UiAnimatedSection>

      <!-- Loading -->
      <div v-if="store.loading" class="text-center py-20 text-[var(--color-muted)]">
        Chargement des projets…
      </div>

      <!-- Grille de projets -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UiAnimatedSection
          v-for="project in filtered"
          :key="project._id"
        >
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
          />
        </UiAnimatedSection>
      </div>

      <!-- Empty state -->
      <div v-if="!store.loading && filtered.length === 0" class="text-center py-20 text-[var(--color-muted)]">
        <p class="text-4xl mb-4">🏔️</p>
        <p class="text-sm">Aucun projet dans cette catégorie pour l'instant.</p>
      </div>
    </div>
  </div>
</template>
