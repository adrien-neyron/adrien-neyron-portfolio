<script setup lang="ts">
/**
 * Carte d'un sentier (projet) dans l'index /projects.
 * Un seul lien par carte (le titre), étendu à toute la carte en CSS : la carte
 * entière est cliquable sans créer de liens en double pour le clavier et les
 * lecteurs d'écran.
 */
import type { Project } from "~/stores/projects";
import { defaultProfile } from "~/utils/trail";

const props = defineProps<{
  project: Project;
  /** numéro du sentier dans la liste (1, 2, 3…) */
  index: number;
}>();

const slug = computed(() => props.project.slug || props.project._id);
const points = computed(() =>
  props.project.profile?.length ? props.project.profile : defaultProfile(slug.value)
);
const number = computed(() => String(props.index).padStart(2, "0"));
const where = computed(() => props.project.place || props.project.category);
</script>

<template>
  <article class="topo-card trail-card">
    <div class="flex items-start justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.12em]">
      <span class="text-(--color-accent) font-medium">Sentier {{ number }}<template v-if="where"> · {{ where }}</template></span>
      <span v-if="project.status" class="text-(--color-muted)">{{ project.status }}</span>
    </div>

    <h2 class="text-2xl leading-tight text-(--color-text)">
      <NuxtLink :to="`/projects/${slug}`" class="topo-card__link">
        {{ project.title }}
      </NuxtLink>
    </h2>

    <p class="text-sm text-(--color-muted) leading-relaxed line-clamp-3">
      {{ project.tagline || project.description }}
    </p>

    <TrailElevationProfile :points="points" :height="64" compact />

    <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      <dt class="font-mono text-[11px] uppercase tracking-[0.1em] text-(--color-muted) pt-0.5">Rôle</dt>
      <dd class="text-(--color-text)">{{ project.role }}</dd>
      <template v-if="project.impact">
        <dt class="font-mono text-[11px] uppercase tracking-[0.1em] text-(--color-muted) pt-0.5">Arrivée</dt>
        <dd class="text-(--color-text)">{{ project.impact }}</dd>
      </template>
    </dl>

    <ul class="flex flex-wrap gap-1.5 mt-auto" aria-label="Technologies">
      <li v-for="tech in project.technologies.slice(0, 4)" :key="tech">
        <UiTechBadge :label="tech" />
      </li>
      <li v-if="project.technologies.length > 4">
        <UiTechBadge :label="`+${project.technologies.length - 4}`" />
      </li>
    </ul>

    <p class="text-sm font-medium text-(--color-accent)" aria-hidden="true">Lire la fiche →</p>
  </article>
</template>

<style scoped>
.topo-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  height: 100%;
  padding: 1.75rem;
}
/* lien étendu à toute la carte */
.topo-card__link { text-decoration: none; }
.topo-card__link::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 1rem;
}
.topo-card__link:focus-visible { outline: none; }
.topo-card__link:focus-visible::after {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
.topo-card:hover .topo-card__link { text-decoration: underline; text-underline-offset: 3px; }
</style>
