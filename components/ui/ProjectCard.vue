<script setup lang="ts">
import { ExternalLink, Github, Clock, ChevronRight } from "lucide-vue-next";
import { formatCoords } from "~/utils/trail";

const props = defineProps<{
  title: string;
  role: string;
  description: string;
  technologies: string[];
  imageUrl?: string;
  link?: string;
  code?: string;
  slug?: string;
  // Anciennes valeurs ("Débutant"/"Intermédiaire"/"Expert") acceptées en
  // lecture pour les projets pas encore ré-enregistrés — voir
  // composables/useDifficultyBadge.ts.
  difficulty?: "Apprentissage" | "Side Project" | "Professionnel" | "Débutant" | "Intermédiaire" | "Expert";
  duration?: string;
  tagline?: string;
  status?: "En production" | "En cours" | "Case study pro";
  impact?: string;
  /**
   * Niveau du titre de la carte, selon la page qui l'affiche (RGAA 9.1 :
   * pas de niveau sauté). 3 par défaut (home : cartes sous le h2
   * « Projets réalisés ») ; 2 sur /projects où les cartes sont juste sous le h1.
   */
  headingLevel?: 2 | 3;
  /** lieu et coordonnées de la fiche topo, affichés en étiquette GPS sur la photo */
  place?: string;
  coords?: { lat?: number; lon?: number };
  /** photo d'ambiance : affichée avec le traitement « grain skate » (main.css) */
  cover?: string;
  /** étape de la trace qui porte ce projet (« Étape 02 · DGFiP… ») et son résultat clé — même source que l'accueil (utils/stages.ts) */
  stage?: string;
  keyResult?: string;
}>();

// Photo d'ambiance en priorité, sinon la capture d'écran — toutes passent par le filtre grain.
const photoSrc = computed(() => props.cover || props.imageUrl || "/projectsoon.png");

const gpsLabel = computed(() => {
  const c = formatCoords(props.coords);
  return [props.place, c].filter(Boolean).join(" · ");
});

const headingTag = computed(() => `h${props.headingLevel ?? 3}`);

// Couleurs du texte assombries (clair) / éclaircies (sombre) pour atteindre
// ≥ 4.5:1 (RGAA 3.2 / WCAG 1.4.3) sur la pastille teintée, quel que soit le
// fond de carte (jour, aube, heure dorée, crépuscule, nuit) :
// clair : vert 5.2:1, jaune 5.2:1, bleu 4.7:1 — sombre : 6.8 / 7.6 / 5.1:1.
// Les -600 d'origine tombaient à 2.7 / 2.4 / 4.2:1.
const statusClass: Record<string, string> = {
  "En production":  "bg-green-500/15 text-green-800 dark:text-green-400",
  "En cours":       "bg-yellow-500/15 text-yellow-800 dark:text-yellow-400",
  "Case study pro": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

const { difficultyLabel, difficultyClass } = useDifficultyBadge();
</script>

<template>
  <article
    :aria-label="title"
    class="trail-card group flex flex-col overflow-hidden h-full"
  >
    <!-- Image -->
    <!-- Photo décorative (alt vide, RGAA 1.2) : le titre de la carte porte l'information -->
    <!-- Filtre « grain skate » sur TOUTES les cartes, quelle que soit la source de
         l'image (photo admin, Unsplash, défaut, capture ou /projectsoon.png) :
         la grille reste homogène. Seule la section « Départ » de la fiche garde
         la capture nette, pour qu'elle reste lisible. -->
    <div class="grain-photo relative w-full overflow-hidden">
      <NuxtImg
        :src="photoSrc"
        alt=""
        width="800"
        height="450"
        class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <!-- Étiquette GPS : lieu du sentier (information aussi présente sur la fiche) -->
      <span v-if="gpsLabel" class="gps-tag absolute bottom-3 left-3">{{ gpsLabel }}</span>
      <!-- Difficulty badge -->
      <span
        v-if="difficulty"
        :class="['absolute z-[2] top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full', difficultyClass(difficulty)]"
      >
        {{ difficultyLabel(difficulty) }}
      </span>
    </div>

    <!-- Content -->
    <div class="p-5 flex flex-col gap-3 flex-1">
      <div>
        <div class="flex items-start justify-between gap-2 flex-wrap">
          <component :is="headingTag" class="font-bold text-[var(--color-text)] text-base leading-snug">{{ title }}</component>
          <span
            v-if="status"
            :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0', statusClass[status]]"
          >
            {{ status }}
          </span>
        </div>
        <p v-if="stage" class="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-muted)] mt-1">{{ stage }}</p>
        <p class="text-xs font-medium text-[var(--color-accent)] mt-0.5">{{ role }}</p>
        <p v-if="tagline" class="text-xs text-[var(--color-muted)] italic mt-1">{{ tagline }}</p>
      </div>

      <p class="text-sm text-[var(--color-text)]/70 leading-relaxed line-clamp-2">{{ description }}</p>

      <!-- Résultat clé de l'étape (source unique), sinon l'impact saisi sur le projet -->
      <div
        v-if="keyResult || impact"
        class="text-xs font-semibold text-[var(--color-accent)] bg-[var(--color-accent)]/8 rounded-lg px-3 py-1.5"
      >
        {{ keyResult || impact }}
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
