import { Mountain, Code2, Camera } from "lucide-vue-next";

/**
 * Libellé, icône et classe CSS de la pastille catégorie du Carnet
 * (/carnet). Suit le même principe que useDifficultyBadge.ts : couleurs
 * fixes (indépendantes du mode clair/sombre), contrastées pour le texte
 * blanc qu'elles portent — voir les classes .badge-carnet-* dans
 * assets/css/main.css.
 */
export type CarnetCategory = "Trail" | "Dev" | "Coulisses";

const CLASSES: Record<CarnetCategory, string> = {
  Trail: "badge-carnet-trail",
  Dev: "badge-carnet-dev",
  Coulisses: "badge-carnet-coulisses",
};

const ICONS: Record<CarnetCategory, typeof Mountain> = {
  Trail: Mountain,
  Dev: Code2,
  Coulisses: Camera,
};

export function useCarnetCategory() {
  function categoryClass(value?: string | null): string {
    return CLASSES[value as CarnetCategory] ?? "badge-carnet-coulisses";
  }

  function categoryIcon(value?: string | null) {
    return ICONS[value as CarnetCategory] ?? Camera;
  }

  return { categoryClass, categoryIcon };
}
