import { defineStore } from "pinia";
import { projects as staticProjects } from "~/data/projects";
import type { Milestone, ProjectStat } from "~/utils/trail";

export interface Project {
  _id: string;
  slug?: string;
  title: string;
  tagline?: string;
  role: string;
  description: string;
  challenge?: string;   // « Passages délicats » sur la fiche projet
  solution?: string;    // « L'itinéraire choisi »
  result?: string;      // « Arrivée — résultats »
  technologies: string[];
  image?: { light?: string; dark?: string };
  cover?: string;         // photo d'ambiance « grain skate » (cartes + en-tête de fiche)
  coverCredit?: string;
  coverCreditUrl?: string;
  coverSource?: "admin" | "unsplash"; // voir server/utils/projectCover.ts
  coverUnsplashId?: string;
  coverQuery?: string;
  link?: string;
  code?: string;
  // Anciennes valeurs acceptées en lecture — voir composables/useDifficultyBadge.ts
  difficulty?: "Apprentissage" | "Side Project" | "Professionnel" | "Débutant" | "Intermédiaire" | "Expert";
  duration?: string;
  status?: "En production" | "En cours" | "Case study pro";
  impact?: string;
  category?: string;
  imageUrl?: string; // injecté côté vue selon le thème
  type?: "mission" | "perso";   // vide : repli par slug (utils/stages.ts, projectType)
  // fiche topo (refonte « L'ascension »)
  order?: number;
  place?: string;
  coords?: { lat?: number; lon?: number };
  startDate?: string;
  profile?: number[];
  milestones?: Milestone[];
  stats?: ProjectStat[];
}

const staticFallback: Project[] = staticProjects.map((p) => ({
  _id: p.id,
  slug: p.id,
  title: p.title,
  tagline: p.tagline,
  role: p.role,
  description: p.description,
  challenge: p.challenge,
  solution: p.solution,
  result: p.result,
  technologies: p.technologies,
  image: p.image,
  cover: p.cover,
  coverCredit: p.coverCredit,
  coverCreditUrl: p.coverCreditUrl,
  link: p.link,
  code: p.code,
  difficulty: p.difficulty,
  duration: p.duration,
  status: p.status,
  impact: p.impact,
  category: p.category,
  place: p.place,
  coords: p.coords,
  startDate: p.startDate,
  profile: p.profile,
  milestones: p.milestones,
  stats: p.stats,
}));

/**
 * Dernier filet de sécurité pour la photo d'ambiance. Ordre de priorité :
 *   1. photo mise dans /admin (coverSource "admin")      ┐ stockées dans Mongo,
 *   2. photo Unsplash trouvée puis stockée en base        ┘ renvoyées par /api/projects
 *   3. ici : photo par défaut du même slug (data/projects.ts) si la base n'a
 *      rien (pas de clé Unsplash, Unsplash indisponible, base hors ligne)
 *   4. dans UiProjectCard : la capture d'écran, puis /projectsoon.png
 */
function withDefaultCover(p: Project): Project {
  if (p.cover) return p;
  const fallback = staticFallback.find((s) => s.slug === p.slug);
  return fallback?.cover
    ? { ...p, cover: fallback.cover, coverCredit: fallback.coverCredit, coverCreditUrl: fallback.coverCreditUrl }
    : p;
}

export const useProjectsStore = defineStore("projects", () => {
  const projects = ref<Project[]>([]);
  const loading  = ref(false);
  const error    = ref<string | null>(null);

  async function fetchProjects() {
    if (projects.value.length) return; // cache simple — pas de re-fetch inutile
    loading.value = true;
    error.value   = null;
    try {
      const result = await $fetch<Project[]>("/api/projects");
      projects.value = result.length ? result.map(withDefaultCover) : staticFallback;
    } catch {
      projects.value = staticFallback;
      error.value = "Impossible de charger les projets.";
    } finally {
      loading.value = false;
    }
  }

  return { projects, loading, error, fetchProjects };
});
