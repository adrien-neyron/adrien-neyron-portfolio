/**
 * Photos d'ambiance des cartes projet (« grain skate »)
 * ─────────────────────────────────────────────────────
 * Ordre de priorité (du plus fort au plus faible) :
 *
 *   1. Photo choisie dans le backoffice (/admin) → `coverSource: "admin"`.
 *      Jamais remplacée automatiquement. Un projet enregistré avant cette
 *      fonctionnalité qui a déjà une `cover` sans `coverSource` compte aussi
 *      comme « admin » (on ne touche pas à ce qu'Adri a saisi).
 *   2. Photo Unsplash stockée en base → `coverSource: "unsplash"`.
 *      Trouvée automatiquement à partir du sujet du projet (ou choisie parmi
 *      les suggestions dans /admin), puis enregistrée dans Mongo : URL, crédit,
 *      id Unsplash et mots-clés. Elle n'est cherchée qu'UNE fois.
 *   3. Aucune photo (pas de clé Unsplash, API indisponible, aucun résultat)
 *      → le front retombe sur la photo par défaut du slug (data/projects.ts),
 *      puis sur la capture d'écran.
 *
 * Le filtre visuel n'est PAS appliqué ici : c'est la classe CSS `.grain-photo`
 * (assets/css/main.css) qui traite toutes les photos, quelle que soit leur
 * source. La base stocke l'original.
 *
 * Licence Unsplash : les photos sont affichées depuis images.unsplash.com
 * (hotlink demandé par les règles de l'API), le photographe est crédité avec
 * un lien, et chaque photo retenue est signalée à Unsplash
 * (`download_location`), comme l'exigent les règles de l'API.
 * https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines
 */
import { GoogleGenAI } from "@google/genai";
import { projects as curatedProjects } from "~/data/projects";

export type CoverSource = "admin" | "unsplash";

export interface CoverFields {
  cover?: string;
  coverCredit?: string;
  coverCreditUrl?: string;
  coverSource?: CoverSource;
  coverUnsplashId?: string;
  coverQuery?: string;
  coverCheckedAt?: Date;
}

/** Champs du projet utiles pour deviner le sujet de la photo. */
export interface CoverSubject extends CoverFields {
  slug?: string;
  title?: string;
  tagline?: string;
  description?: string;
  category?: string;
  technologies?: string[];
}

export interface UnsplashCandidate {
  id: string;
  /** URL d'affichage 16:9 (1600 px) — c'est elle qui est stockée en base */
  url: string;
  /** vignette pour la grille de choix dans /admin */
  thumb: string;
  /** description Unsplash, utile dans /admin (la photo reste décorative sur le site) */
  alt: string;
  credit: string;
  creditUrl: string;
  downloadLocation: string;
}

const API = "https://api.unsplash.com";
const UTM = "utm_source=adrien_neyron_portfolio&utm_medium=referral";
/** On ne relance pas une recherche ratée avant ce délai (quota Unsplash : 50 req/h en mode démo). */
const RETRY_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Sujet photo par catégorie, en anglais (Unsplash indexe surtout en anglais).
 * Des objets et des lieux, jamais des écrans : le grain N&B rend les captures
 * illisibles, et une photo « d'ambiance » raconte le métier, pas l'interface.
 */
const CATEGORY_QUERIES: Record<string, string> = {
  "E-commerce":     "shop counter storefront",
  "Outil métier":   "office archive paperwork",
  "LMS":            "classroom notebook",
  "IA":             "night desk lamp",
  "Automatisation": "conveyor machine",
  "SI":             "server room cables",
  "Autre":          "mountain trail",
};

/**
 * Détermine la source d'une cover reçue du formulaire /admin.
 * - vide → aucune source (une photo sera cherchée à l'enregistrement)
 * - choisie parmi les suggestions Unsplash → "unsplash" (le formulaire l'indique)
 * - tapée ou uploadée → "admin"
 */
export function coverSourceFromForm(body: { cover?: string; coverSource?: string }): CoverSource | undefined {
  if (!body.cover) return undefined;
  return body.coverSource === "unsplash" ? "unsplash" : "admin";
}

function unsplashKey(): string {
  return (useRuntimeConfig().unsplashAccessKey as string) || "";
}

export function isUnsplashConfigured(): boolean {
  return Boolean(unsplashKey());
}

/** Photo par défaut choisie à la main pour ce slug (data/projects.ts), s'il y en a une. */
function curatedCover(slug?: string) {
  const p = curatedProjects.find((c) => c.id === slug);
  if (!p?.cover) return null;
  const id = p.coverCreditUrl?.match(/unsplash\.com\/photos\/([^/?#]+)/)?.[1];
  return { cover: p.cover, coverCredit: p.coverCredit, coverCreditUrl: p.coverCreditUrl, coverUnsplashId: id };
}

/**
 * Mots-clés de recherche, par ordre de préférence :
 * 1. ceux saisis dans /admin (`coverQuery`)
 * 2. 2-4 mots anglais proposés par Gemini à partir du titre + description
 * 3. la table par catégorie ci-dessus
 */
export async function buildCoverQuery(p: CoverSubject): Promise<string> {
  if (p.coverQuery?.trim()) return p.coverQuery.trim();

  const geminiKey = useRuntimeConfig().geminiApiKey as string;
  if (geminiKey && (p.description || p.tagline)) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const res = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents:
          `Projet : ${p.title ?? ""}\n${p.tagline ?? ""}\n${p.description ?? ""}\n\n` +
          "Propose 2 à 4 mots-clés ANGLAIS pour chercher sur Unsplash une photo d'ambiance " +
          "qui évoque le MÉTIER ou le MONDE RÉEL de ce projet (objets, lieux, gestes). " +
          "Jamais d'écran, d'ordinateur, de code, de logo ni de texte. " +
          "Réponds uniquement par les mots-clés séparés par des espaces.",
        config: { temperature: 0.4, maxOutputTokens: 30 },
      });
      const words = (res.text ?? "").replace(/[^a-zA-Z\s-]/g, " ").trim().split(/\s+/).slice(0, 4).join(" ");
      if (words) return words;
    } catch (e) {
      console.warn("[projectCover] Gemini indisponible, repli sur la catégorie :", e);
    }
  }

  return CATEGORY_QUERIES[p.category ?? ""] ?? CATEGORY_QUERIES.Autre;
}

async function unsplashFetch<T>(path: string, query: Record<string, string | number>): Promise<T> {
  return await $fetch<T>(`${API}${path}`, {
    query,
    headers: { Authorization: `Client-ID ${unsplashKey()}`, "Accept-Version": "v1" },
    timeout: 6000,
  });
}

interface UnsplashPhoto {
  id: string;
  alt_description?: string | null;
  description?: string | null;
  urls: { raw: string; small: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
}

/** Recherche Unsplash : photos paysage, filtre de contenu strict. */
export async function searchUnsplash(query: string, opts: { perPage?: number; exclude?: string[] } = {}): Promise<UnsplashCandidate[]> {
  if (!isUnsplashConfigured()) return [];
  const data = await unsplashFetch<{ results: UnsplashPhoto[] }>("/search/photos", {
    query,
    orientation: "landscape",
    content_filter: "high",
    per_page: Math.min(30, (opts.perPage ?? 6) + (opts.exclude?.length ?? 0)),
  });
  const exclude = new Set(opts.exclude ?? []);
  return data.results
    .filter((ph) => !exclude.has(ph.id))
    .slice(0, opts.perPage ?? 6)
    .map((ph) => ({
      id: ph.id,
      // Recadrage 16:9 côté Unsplash (paramètres imgix), 1600 px suffit pour la bannière de fiche
      url: `${ph.urls.raw}&w=1600&h=900&fit=crop&crop=entropy&q=75&auto=format`,
      thumb: ph.urls.small,
      alt: ph.alt_description || ph.description || "",
      credit: `${ph.user.name} / Unsplash`,
      creditUrl: `${ph.links.html}?${UTM}`,
      downloadLocation: ph.links.download_location,
    }));
}

/** Signale à Unsplash qu'une photo est retenue (obligatoire, sans effet visible). */
export async function trackUnsplashDownload(photoId: string): Promise<void> {
  if (!isUnsplashConfigured() || !photoId) return;
  try {
    await unsplashFetch(`/photos/${photoId}/download`, {});
  } catch (e) {
    console.warn("[projectCover] suivi de téléchargement Unsplash impossible :", e);
  }
}

/**
 * Cherche la photo d'un projet qui n'en a pas.
 * Retourne les champs à enregistrer en base, ou `null` s'il n'y a rien à faire
 * (photo admin ou Unsplash déjà en place, recherche ratée il y a moins de 24 h).
 * Ne lève jamais d'erreur : l'enregistrement d'un projet ne doit pas échouer
 * à cause d'Unsplash.
 */
export async function findCoverFor(p: CoverSubject, opts: { force?: boolean } = {}): Promise<CoverFields | null> {
  if (p.cover) return null; // priorité : une photo déjà en base (admin ou Unsplash) n'est jamais écrasée ici
  if (!opts.force && p.coverCheckedAt && Date.now() - new Date(p.coverCheckedAt).getTime() < RETRY_AFTER_MS) {
    return null;
  }

  // Les photos déjà choisies à la main pour les projets historiques passent avant une recherche.
  const curated = curatedCover(p.slug);
  if (curated) {
    if (curated.coverUnsplashId) await trackUnsplashDownload(curated.coverUnsplashId);
    // Une photo Unsplash reste "unsplash" ; un visuel maison (ex. /recentprojects/…) compte comme "admin".
    return { ...curated, coverSource: curated.coverUnsplashId ? "unsplash" : "admin", coverCheckedAt: new Date() };
  }

  if (!isUnsplashConfigured()) return null;

  try {
    const query = await buildCoverQuery(p);
    const [best] = await searchUnsplash(query, { perPage: 1 });
    if (!best) return { coverQuery: query, coverCheckedAt: new Date() };
    await trackUnsplashDownload(best.id);
    return {
      cover: best.url,
      coverCredit: best.credit,
      coverCreditUrl: best.creditUrl,
      coverSource: "unsplash",
      coverUnsplashId: best.id,
      coverQuery: query,
      coverCheckedAt: new Date(),
    };
  } catch (e) {
    console.warn(`[projectCover] recherche Unsplash impossible pour « ${p.slug} » :`, e);
    return { coverCheckedAt: new Date() };
  }
}
