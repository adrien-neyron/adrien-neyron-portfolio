/**
 * Navigation du site : UNE seule source pour l'accueil (menu « Étapes » de la boucle),
 * le menu des pages (`components/navigation/TrailNav.vue`) et le pied de page.
 * Ordre et vocabulaire de la boucle (décision du 19/10, docs/audit-coherence.md) :
 * métaphore d'aventure + libellé explicite, jamais la métaphore seule (RGAA).
 */
export interface NavLink { label: string; path: string }
export interface NavStep {
  metaphor: string;          // « Monter »
  label: string;             // « Sentiers »
  links: NavLink[];          // pages de l'étape (une ou plusieurs)
}

export const NAV_STEPS: NavStep[] = [
  { metaphor: "Se repérer", label: "Accueil",    links: [{ label: "Accueil", path: "/" }] },
  { metaphor: "S'équiper",  label: "Équipement", links: [{ label: "Équipement", path: "/ai-tools" }] },
  { metaphor: "Monter",     label: "Sentiers",   links: [{ label: "Sentiers", path: "/projects" }] },
  { metaphor: "Persévérer", label: "Le Randonneur et Carnet", links: [{ label: "Le Randonneur", path: "/about" }, { label: "Carnet", path: "/carnet" }] },
  { metaphor: "Se poser",   label: "Contact",    links: [{ label: "Contact", path: "/contact" }] },
];

/** Liens à plat (pied de page, tests). */
export const NAV_LINKS: NavLink[] = NAV_STEPS.flatMap((s) => s.links);
