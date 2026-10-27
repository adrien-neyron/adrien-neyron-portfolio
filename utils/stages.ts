/**
 * Étapes de la trace de l'accueil : source unique pour la carte (assets/loop/loop.js), la liste statique de l'accueil
 * (utils/loopMarkup.ts), la page /projects et la fiche /projects/[id] (voir docs/architecture-site.md).
 *
 * Fonctions pures (aucun accès réseau, aucun aléa) : utilisables côté serveur, côté client et dans loop.js.
 * Rien n'est inventé : une étape sans chiffre n'a pas de résultat clé, un projet lié introuvable n'a pas de lien.
 */
export type StageKind = "depart" | "etape" | "bivouac" | "final";
export type ProjectType = "mission" | "perso";

export interface Stage {
  _id?: string;
  id?: string;
  key: string;            // identifiant stable : « depart », « etape-01 »…
  order: number;          // rang sur la trace (0 = départ)
  kind: StageKind;
  period: string;         // « Oct. 2021 – Déc. 2023 »
  title: string;          // « Développeur web freelance »
  place?: string;
  summary?: string;       // une phrase sous le titre
  figure?: string;        // chiffre : « −50 % » (vide : pas de chiffre affiché)
  figureLabel?: string;   // libellé du chiffre : « de temps de traitement »
  projects?: string[];    // slugs des fiches liées (/projects/<slug>)
}

export interface StageProjectRef { slug?: string; title?: string }
export interface StageLink { slug: string; title: string; href: string }

export interface StageView extends Stage {
  label: string;          // « Départ », « Étape 01 », « Bivouac », « Cairn final »
  num: number | null;     // numéro d'étape (null : départ, bivouac, cairn final)
  t: number;              // abscisse sur la trace, 0 → 1
  km: number;
  gain: number;           // dénivelé positif cumulé, arrondi à 10 m
  keyResult: string;      // « −50 % de temps de traitement » ; vide sans chiffre
  links: StageLink[];     // fiches liées réellement présentes
  href: string;           // lien principal : première fiche, /contact pour le cairn final, vide sinon
}

/** Totaux de la trace (simulation inspirée de la Diagonale des Fous) : répartis à parts égales entre les étapes. */
export const TRAIL_TOTAL = { km: 180, gain: 10200 } as const;

export const projectHref = (slug: string) => `/projects/${encodeURIComponent(slug)}`;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Nettoie un enregistrement venu de la base ou de l'admin (champs texte rognés, slugs vides écartés). */
export function normalizeStage(s: Partial<Stage> & Record<string, unknown>): Stage {
  const kind = (["depart", "etape", "bivouac", "final"] as const).includes(s.kind as StageKind) ? (s.kind as StageKind) : "etape";
  return {
    ...(s._id ? { _id: String(s._id) } : {}),
    key: str(s.key),
    order: Number.isFinite(Number(s.order)) ? Number(s.order) : 0,
    kind,
    period: str(s.period),
    title: str(s.title),
    place: str(s.place),
    summary: str(s.summary),
    figure: str(s.figure),
    figureLabel: str(s.figureLabel),
    projects: (Array.isArray(s.projects) ? s.projects : []).map(str).filter(Boolean),
  };
}

export const keyResult = (s: Pick<Stage, "figure" | "figureLabel">) =>
  str(s.figure) ? [str(s.figure), str(s.figureLabel)].filter(Boolean).join(" ") : "";

/**
 * Vue calculée des étapes, dans l'ordre de la trace.
 * - Départ, étapes et cairn final se partagent la trace à intervalles égaux (4 étapes + cairn final : 0, 45, 90, 135, 180 km).
 * - Un bivouac n'est pas une étape : il se pose entre ses deux voisins, sans numéro.
 * - Les fiches liées ne deviennent des liens que si le projet existe (`projects` : liste publique des projets).
 */
export function buildStageView(stages: Stage[], projects: StageProjectRef[] = []): StageView[] {
  const list = stages.map((s) => normalizeStage(s as Stage & Record<string, unknown>)).sort((a, b) => a.order - b.order);
  const main = list.filter((s) => s.kind !== "bivouac");
  const tOf = new Map<Stage, number>();
  main.forEach((s, i) => tOf.set(s, main.length > 1 ? i / (main.length - 1) : 0));
  // bivouacs : répartis entre l'étape d'avant et celle d'après
  for (let i = 0; i < list.length; ) {
    if (list[i].kind !== "bivouac") { i++; continue }
    let j = i;
    while (j < list.length && list[j].kind === "bivouac") j++;
    const t0 = i > 0 ? tOf.get(list[i - 1])! : 0;
    const t1 = j < list.length ? tOf.get(list[j])! : 1;
    for (let k = i; k < j; k++) tOf.set(list[k], t0 + ((t1 - t0) * (k - i + 1)) / (j - i + 1));
    i = j;
  }
  const titleOf = new Map(projects.filter((p) => str(p.slug)).map((p) => [str(p.slug), str(p.title) || str(p.slug)]));
  let n = 0;
  return list.map((s) => {
    const t = +(tOf.get(s) ?? 0).toFixed(4);
    const num = s.kind === "etape" ? ++n : null;
    const label =
      s.kind === "depart" ? "Départ" : s.kind === "bivouac" ? "Bivouac" : s.kind === "final" ? "Cairn final" : `Étape ${String(num).padStart(2, "0")}`;
    const links = (s.projects || []).filter((slug) => titleOf.has(slug)).map((slug) => ({ slug, title: titleOf.get(slug)!, href: projectHref(slug) }));
    return {
      ...s,
      label,
      num,
      t,
      km: Math.round(TRAIL_TOTAL.km * t),
      gain: Math.round((TRAIL_TOTAL.gain * t) / 10) * 10,
      keyResult: keyResult(s),
      links,
      href: s.kind === "final" ? "/contact" : links[0]?.href ?? "",
    };
  });
}

/** Étape qui porte une fiche projet (la première trouvée), ou null. */
export function stageOfProject(slug: string | undefined, view: StageView[]): StageView | null {
  const s = str(slug);
  return s ? view.find((v) => (v.projects || []).includes(s)) ?? null : null;
}

/** « Étape 02 · DGFiP, mission via BeTeam » : numéro et nom, tels qu'affichés partout. */
export const stageHeading = (v: Pick<StageView, "label" | "title">) => [v.label, v.title].filter(Boolean).join(" · ");

/** Type par défaut (repli tant que le champ n'est pas saisi dans l'admin). */
export const DEFAULT_PROJECT_TYPES: Record<string, ProjectType> = {
  "dgfip-outil-metier": "mission",
  "click2sellsite-accessibilite": "mission",
  stockpulse: "mission",
  coachflow: "perso",
  "runfit-advisor": "perso",
  dressmeup: "perso",
};

export function projectType(p: { slug?: string; type?: string }): ProjectType | null {
  if (p.type === "mission" || p.type === "perso") return p.type;
  return DEFAULT_PROJECT_TYPES[str(p.slug)] ?? null;
}

/** Visible sur /projects : un type (mission ou perso) et une fiche complète (défi, solution et résultat renseignés). */
export const isListedProject = (p: { slug?: string; type?: string; challenge?: string; solution?: string; result?: string }) =>
  !!projectType(p) && !!str(p.challenge) && !!str(p.solution) && !!str(p.result);

/* ------------------------------------------------------------------------------------------------
 * Saisie d'une étape dans /admin : emplacement sur la trace, clé, validation.
 * Le numéro d'une étape ne se saisit pas : il découle de son emplacement (buildStageView).
 * ---------------------------------------------------------------------------------------------- */

export type StageField = "kind" | "title" | "key" | "placement";
export interface StageIssue { field: StageField; message: string }
export interface PlacementOption { value: string; label: string }

/** Valeur de l'emplacement « tout au début de la trace » (proposé tant qu'il n'y a pas de Départ). */
export const PLACE_START = "__start";

const byOrder = (a: Stage, b: Stage) => a.order - b.order;

/** Clé technique proposée à partir du type et du titre : `etape-developpeur-web-freelance`, `depart`, `final`. */
export function stageKeyFromTitle(kind: StageKind, title: string): string {
  if (kind === "depart" || kind === "final") return kind;
  const slug = str(title).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
  return slug ? `${kind}-${slug}` : kind;
}

/**
 * Emplacements proposés pour une étape numérotée ou un bivouac : « Après <étape> », sauf après le cairn final
 * (la trace s'y arrête). Les autres étapes sont celles déjà enregistrées, sans celle qu'on modifie.
 */
export function placementOptions(others: Stage[]): PlacementOption[] {
  const sorted = others.map((s) => normalizeStage(s as Stage & Record<string, unknown>)).sort(byOrder);
  const view = buildStageView(sorted);
  const opts: PlacementOption[] = [];
  if (!sorted.some((s) => s.kind === "depart")) opts.push({ value: PLACE_START, label: "Au tout début de la trace" });
  view.forEach((v) => {
    if (v.kind === "final") return;
    opts.push({ value: v.key, label: `Après « ${v.label}${v.title ? ` · ${v.title}` : ""} »` });
  });
  return opts;
}

/** Emplacement actuel d'une étape déjà enregistrée : la clé de l'étape qui la précède (ou le début de la trace). */
export function placementOf(others: Stage[], order: number): string {
  const before = others.map((s) => normalizeStage(s as Stage & Record<string, unknown>)).filter((s) => s.order < order).sort(byOrder).pop();
  return before ? before.key : PLACE_START;
}

/**
 * Rang (`order`) à enregistrer. Le Départ passe avant tout, le cairn final après tout ; les autres se glissent
 * entre l'étape choisie et la suivante (milieu des deux rangs : aucune autre étape n'est à renuméroter).
 * Renvoie null si l'emplacement choisi n'existe pas.
 */
export function orderForPlacement(others: Stage[], kind: StageKind, placement: string): number | null {
  const sorted = others.map((s) => normalizeStage(s as Stage & Record<string, unknown>)).sort(byOrder);
  if (kind === "depart") return sorted.length ? sorted[0].order - 1 : 0;
  if (kind === "final") return sorted.length ? sorted[sorted.length - 1].order + 1 : 0;
  if (!sorted.length) return 0;
  if (placement === PLACE_START) return sorted[0].order - 1;
  const i = sorted.findIndex((s) => s.key === placement);
  if (i < 0 || sorted[i].kind === "final") return null;
  const next = sorted[i + 1];
  return next ? (sorted[i].order + next.order) / 2 : sorted[i].order + 1;
}

/** Contrôles de la saisie, messages explicites : ce qui ne va pas, pourquoi, et quoi faire. Même fonction côté serveur. */
export function validateStage(form: Partial<Stage>, others: Stage[], placement = ""): StageIssue[] {
  const issues: StageIssue[] = [];
  const kind = (["depart", "etape", "bivouac", "final"] as const).find((k) => k === form.kind);
  const title = str(form.title);
  const key = str(form.key);
  const rest = others.map((s) => normalizeStage(s as Stage & Record<string, unknown>));
  if (!kind) issues.push({ field: "kind", message: "Choisis le type de l'étape : Départ, Étape, Bivouac ou Cairn final." });
  if (!title) issues.push({ field: "title", message: "Le titre est obligatoire : il est gravé sur la stèle et affiché dans la liste des étapes." });
  if (!key) issues.push({ field: "key", message: "La clé est obligatoire. C'est l'identifiant technique de l'étape, par exemple « etape-04 »." });
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key)) issues.push({ field: "key", message: "La clé ne peut contenir que des minuscules sans accent, des chiffres et des tirets (« etape-04 »)." });
  else {
    const same = rest.find((s) => s.key === key);
    if (same) issues.push({ field: "key", message: `La clé « ${key} » est déjà utilisée par l'étape « ${same.title || same.key} ». Choisis une autre clé.` });
  }
  if (kind === "depart" || kind === "final") {
    const dup = rest.find((s) => s.kind === kind);
    if (dup) issues.push({ field: "kind", message: `Il existe déjà un ${kind === "depart" ? "Départ" : "Cairn final"} (« ${dup.title || dup.key} »). Une trace n'en a qu'un : modifie-le, ou choisis un autre type.` });
  } else if (kind && rest.length) {
    if (!placement) issues.push({ field: "placement", message: "Choisis l'emplacement sur la trace : le numéro de l'étape en découle." });
    else if (orderForPlacement(rest, kind, placement) === null) issues.push({ field: "placement", message: "Cet emplacement n'existe plus (l'étape a peut-être été supprimée). Choisis-en un autre dans la liste." });
  }
  return issues;
}
