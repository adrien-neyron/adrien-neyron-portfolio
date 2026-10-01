/**
 * Utilitaires de la refonte « L'ascension » (langage cartographique).
 * Fonctions pures et déterministes : même résultat côté serveur et client
 * (pas de Math.random), donc aucun écart d'hydratation.
 */

/** Étape affichée sur un profil d'altitude. */
export interface Milestone { label: string; detail?: string }

/** Chiffre clé affiché dans « Arrivée ». */
export interface ProjectStat { value: string; label: string }

/** Hash 32 bits simple (FNV-1a) pour dériver une graine d'un slug. */
export function hashString(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Profil d'altitude par défaut d'un projet (0 = bas, 100 = haut) quand aucun
 * profil n'est saisi dans l'admin : une montée irrégulière, propre à chaque slug.
 */
export function defaultProfile(slug: string, count = 13): number[] {
  const rnd = seededRandom(hashString(slug));
  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    const trend = 18 + (i / (count - 1)) * 64;          // de ~18 à ~82
    const noise = (rnd() - 0.5) * 22;
    points.push(Math.max(4, Math.min(96, Math.round(trend + noise))));
  }
  return points;
}

/** Coordonnées GPS au format « 45.764° N · 4.836° E ». */
export function formatCoords(coords?: { lat?: number; lon?: number } | null): string | undefined {
  if (coords?.lat == null || coords?.lon == null) return undefined;
  const lat = `${Math.abs(coords.lat).toFixed(3)}° ${coords.lat >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(coords.lon).toFixed(3)}° ${coords.lon >= 0 ? "E" : "O"}`;
  return `${lat} · ${lon}`;
}

/** Découpe un texte saisi dans l'admin en paragraphes (lignes vides). */
export function toParagraphs(text?: string | null): string[] {
  return (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
