import { defineStore } from "pinia";
import { projects as staticProjects } from "~/data/projects";

export interface Project {
  _id: string;
  title: string;
  role: string;
  description: string;
  technologies: string[];
  image?: { light?: string; dark?: string };
  link?: string;
  code?: string;
  imageUrl?: string; // injecté côté vue selon le thème
}

const staticFallback: Project[] = staticProjects.map((p) => ({
  _id: p.id,
  title: p.title,
  role: p.role,
  description: p.description,
  technologies: p.technologies,
  image: p.image,
  link: p.link,
  code: p.code,
}));

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
      projects.value = result.length ? result : staticFallback;
    } catch {
      projects.value = staticFallback;
      error.value = "Impossible de charger les projets.";
    } finally {
      loading.value = false;
    }
  }

  return { projects, loading, error, fetchProjects };
});
