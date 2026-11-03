/**
 * Navigation du site : UNE seule source pour l'accueil (menu « Étapes » de la boucle),
 * le menu des pages (`components/navigation/TrailNav.vue`) et le pied de page.
 * Ordre et vocabulaire de la boucle (décision du 19/10, docs/audit-coherence.md) :
 * métaphore d'aventure + libellé explicite, jamais la métaphore seule (RGAA).
 */
export interface NavLink { label: string; path: string }
export interface NavStep {
  metaphor: string;          // « Monter »
  label: string;             // « Projets »
  links: NavLink[];          // pages de détail de l'étape (une ou plusieurs)
  scene: string;             // scène de l'accueil : ancre `/#<scene>` ('' = haut de l'accueil)
}

/** Lien d'une étape : toujours la scène de l'accueil (le parcours est l'accueil ; les pages en sont le détail). */
export const sceneHref = (step: Pick<NavStep, "scene">) => (step.scene ? `/#${step.scene}` : "/");

export const NAV_STEPS: NavStep[] = [
  { metaphor: "Se repérer", label: "Accueil",    links: [{ label: "Accueil", path: "/" }], scene: "" },
  { metaphor: "S'équiper",  label: "Équipement", links: [{ label: "Équipement", path: "/ai-tools" }], scene: "equiper" },
  { metaphor: "Monter",     label: "Projets",    links: [{ label: "Projets", path: "/projects" }], scene: "monter" },
  { metaphor: "Persévérer", label: "Le Randonneur et Carnet", links: [{ label: "Le Randonneur", path: "/about" }, { label: "Carnet", path: "/carnet" }], scene: "perseverer" },
  { metaphor: "Se poser",   label: "Contact",    links: [{ label: "Contact", path: "/contact" }], scene: "poser" },
];

/** Liens à plat (pied de page, tests). */
export const NAV_LINKS: NavLink[] = NAV_STEPS.flatMap((s) => s.links);
