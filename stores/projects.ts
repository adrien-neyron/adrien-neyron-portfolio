import { defineStore } from "pinia";

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

export const useProjectsStore = defineStore("projects", () => {
  const projects = ref<Project[]>([]);
  const loading  = ref(false);
  const error    = ref<string | null>(null);

  async function fetchProjects() {
    if (projects.value.length) return; // cache simple — pas de re-fetch inutile
    loading.value = true;
    error.value   = null;
    try {
      projects.value = await $fetch<Project[]>("/api/projects");
    } catch {
      error.value = "Impossible de charger les projets.";
    } finally {
      loading.value = false;
    }
  }

  return { projects, loading, error, fetchProjects };
});
