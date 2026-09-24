import { defineStore } from "pinia";
import { carnetArticles as staticArticles } from "~/data/carnet";

export interface CarnetArticleItem {
  _id?: string;
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category: "Trail" | "Dev" | "Coulisses";
  date: string;
  cover?: string;
  content: string;
  data?: {
    elevation?: string;
    heartRate?: string;
    pace?: string;
  };
}

const staticFallback: CarnetArticleItem[] = staticArticles.map((a) => ({ ...a }));

export const useCarnetStore = defineStore("carnet", () => {
  const articles = ref<CarnetArticleItem[]>([]);
  const loading  = ref(false);
  const error    = ref<string | null>(null);

  async function fetchArticles() {
    if (articles.value.length) return; // cache simple — pas de re-fetch inutile
    loading.value = true;
    error.value   = null;
    try {
      const result = await $fetch<CarnetArticleItem[]>("/api/carnet");
      articles.value = result.length ? result : staticFallback;
    } catch {
      articles.value = staticFallback;
      error.value = "Impossible de charger le carnet.";
    } finally {
      loading.value = false;
    }
  }

  return { articles, loading, error, fetchArticles };
});
