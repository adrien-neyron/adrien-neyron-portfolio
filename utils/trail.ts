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

/** Sommet gaussien du champ d'altitude (axes sx / sy en pixels). */
export interface ContourPeak { x: number; y: number; a: number; sx: number; sy: number }

/**
 * Courbes de niveau d'un champ d'altitude (algorithme « marching squares »).
 * Chaque courbe est une isovaleur d'un même champ : deux courbes ne peuvent donc
 * jamais se croiser ni se chevaucher, contrairement à des ellipses déformées une
 * à une. Déterministe (pas de Math.random) : identique côté serveur et client.
 * Retourne un tracé SVG par niveau, du plus bas (extérieur) au plus haut.
 */
export function contourPaths(
  W: number,
  H: number,
  peaks: ContourPeak[],
  levels: number,
  opts: { cell?: number; wobble?: [number, number]; from?: number; to?: number } = {},
): string[] {
  const cell = opts.cell ?? 16;
  const [w0, w1] = opts.wobble ?? [0, 0];
  const nx = Math.ceil(W / cell) + 1;
  const ny = Math.ceil(H / cell) + 1;
  const f = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = i * cell;
      const y = j * cell;
      let h = 0;
      for (const p of peaks) {
        const dx = (x - p.x) / p.sx;
        const dy = (y - p.y) / p.sy;
        h += p.a * Math.exp(-(dx * dx + dy * dy) / 2);
      }
      f[j * nx + i] = h + 0.04 * Math.sin(x / 130 + w0) * Math.sin(y / 100 + w1);
    }
  }
  const lo = opts.from ?? 0.06;
  const hi = opts.to ?? 0.95;
  const out: string[] = [];
  for (let li = 0; li < levels; li++) {
    const L = lo + (levels > 1 ? (li / (levels - 1)) * (hi - lo) : 0);
    let d = "";
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = f[j * nx + i];
        const b = f[j * nx + i + 1];
        const c = f[(j + 1) * nx + i + 1];
        const e = f[(j + 1) * nx + i];
        const k = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (e > L ? 1 : 0);
        if (k === 0 || k === 15) continue;
        const x0 = i * cell;
        const y0 = j * cell;
        const it = (v0: number, v1: number) => (L - v0) / (v1 - v0);
        const T = [x0 + it(a, b) * cell, y0];
        const R = [x0 + cell, y0 + it(b, c) * cell];
        const B = [x0 + it(e, c) * cell, y0 + cell];
        const Lf = [x0, y0 + it(a, e) * cell];
        const segs: Record<number, number[][][]> = {
          1: [[Lf, B]], 2: [[B, R]], 3: [[Lf, R]], 4: [[T, R]], 5: [[T, Lf], [B, R]], 6: [[T, B]], 7: [[T, Lf]],
          8: [[T, Lf]], 9: [[T, B]], 10: [[T, R], [Lf, B]], 11: [[T, R]], 12: [[Lf, R]], 13: [[B, R]], 14: [[Lf, B]],
        };
        for (const [p, q] of segs[k]) d += `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
      }
    }
    out.push(d);
  }
  return out;
}
