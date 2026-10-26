import { defineStore } from "pinia";
import { stages as staticStages } from "~/data/stages";
import type { Stage } from "~/utils/stages";

/** Étapes de la trace (Mongo via /api/stages), repli data/stages.ts si la base est vide ou indisponible. */
export const useStagesStore = defineStore("stages", () => {
  const stages  = ref<Stage[]>([]);
  const loading = ref(false);
  const error   = ref<string | null>(null);

  async function fetchStages() {
    if (stages.value.length) return; // cache simple — pas de re-fetch inutile
    loading.value = true;
    error.value   = null;
    try {
      const result = await $fetch<Stage[]>("/api/stages");
      stages.value = result.length ? result : staticStages;
    } catch {
      stages.value = staticStages;
      error.value = "Impossible de charger les étapes.";
    } finally {
      loading.value = false;
    }
  }

  return { stages, loading, error, fetchStages };
});
