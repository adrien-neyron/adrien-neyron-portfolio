import { defineStore } from "pinia";
import { aiTools as staticAiTools } from "~/data/ai-tools";
import type { AiTool as StaticAiTool } from "~/data/ai-tools";

export interface AiToolItem {
  _id?: string;
  id?: string;
  slug?: string;
  name: string;
  provider?: string;
  category: string;
  tagline?: string;
  description?: string;
  useCases: string[];
  businessValue?: string;
  icon?: string;
  link?: string;
}

const staticFallback: AiToolItem[] = staticAiTools.map((t: StaticAiTool) => ({
  id: t.id,
  slug: t.id,
  name: t.name,
  provider: t.provider,
  category: t.category,
  tagline: t.tagline,
  description: t.description,
  useCases: t.useCases,
  businessValue: t.businessValue,
  icon: t.icon,
  link: t.link,
}));

export const useAiToolsStore = defineStore("aiTools", () => {
  const tools   = ref<AiToolItem[]>([]);
  const loading = ref(false);
  const error   = ref<string | null>(null);

  async function fetchAiTools() {
    if (tools.value.length) return;
    loading.value = true;
    error.value   = null;
    try {
      const result = await $fetch<AiToolItem[]>("/api/ai-tools");
      tools.value = result.length ? result : staticFallback;
    } catch {
      tools.value = staticFallback;
      error.value = "Impossible de charger les outils IA.";
    } finally {
      loading.value = false;
    }
  }

  return { tools, loading, error, fetchAiTools };
});
