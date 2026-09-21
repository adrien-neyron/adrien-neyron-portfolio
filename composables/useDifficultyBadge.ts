/**
 * Libellé + classe CSS du badge de difficulté des projets.
 *
 * Renommage de septembre 2026 : "Professionnel" / "Side Project" /
 * "Apprentissage" remplacent "Expert" / "Intermédiaire" / "Débutant" comme
 * valeurs saisies depuis l'admin (voir components/admin/ProjectForm.vue).
 * Les anciennes valeurs restent reconnues en lecture ici pour que les
 * projets déjà enregistrés en base Mongo avec l'ancien libellé continuent
 * de s'afficher correctement (bon texte, bon badge) tant qu'ils n'ont pas
 * été ré-enregistrés depuis l'admin avec le nouveau champ — aucune
 * migration de données n'est donc nécessaire.
 */
type DifficultyValue =
  | "Apprentissage" | "Side Project" | "Professionnel"
  | "Débutant"       | "Intermédiaire" | "Expert";

const LABELS: Record<DifficultyValue, string> = {
  Apprentissage:    "Apprentissage",
  "Side Project":   "Side Project",
  Professionnel:    "Professionnel",
  // anciens libellés → nouveaux
  Débutant:         "Apprentissage",
  Intermédiaire:    "Side Project",
  Expert:           "Professionnel",
};

const CLASSES: Record<DifficultyValue, string> = {
  Apprentissage:    "badge-debutant",
  "Side Project":   "badge-intermediaire",
  Professionnel:    "badge-expert",
  Débutant:         "badge-debutant",
  Intermédiaire:    "badge-intermediaire",
  Expert:           "badge-expert",
};

export function useDifficultyBadge() {
  function difficultyLabel(value?: string | null): string | undefined {
    if (!value) return undefined;
    return LABELS[value as DifficultyValue] ?? value;
  }

  function difficultyClass(value?: string | null): string | undefined {
    if (!value) return undefined;
    return CLASSES[value as DifficultyValue];
  }

  return { difficultyLabel, difficultyClass };
}
