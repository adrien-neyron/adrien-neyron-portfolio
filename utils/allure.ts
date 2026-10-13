/**
 * Calculateur d'allure trail (pages/outils/allure-denivele.vue) : logique pure, testée dans tests/unit/allure.test.ts.
 *
 * Règle de Naismith adaptée à la course à pied : le D+ coûte 8 min / 100 m, le D- 2 min / 100 m (la réception et
 * le freinage coûtent même quand la pente aide), le tout modulé par la technicité du terrain.
 */
export type Terrain = "facile" | "modere" | "technique";

export const TERRAINS: { value: Terrain; label: string; coeff: number }[] = [
  { value: "facile", label: "Facile", coeff: 0.85 },
  { value: "modere", label: "Modéré", coeff: 1 },
  { value: "technique", label: "Technique", coeff: 1.3 },
];

export const MINUTES_PAR_100M_MONTEE = 8;
export const MINUTES_PAR_100M_DESCENTE = 2;

/** Saisie texte → nombre ≥ 0 (virgule décimale française acceptée), `fallback` si vide ou invalide. */
export function toNumber(raw: string, fallback = 0): number {
  const n = parseFloat(String(raw).trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export interface PaceInput {
  distanceRaw: string;
  denivelePositifRaw: string;
  /** vide = suit le D+ */
  deniveleNegatifRaw: string;
  allureMinRaw: string;
  allureSecRaw: string;
  terrain: Terrain;
}

export function computePace(input: PaceInput) {
  const distance = toNumber(input.distanceRaw, 0);
  const dPlus = toNumber(input.denivelePositifRaw, 0);
  const dMoins = input.deniveleNegatifRaw.trim() === "" ? dPlus : toNumber(input.deniveleNegatifRaw, dPlus);
  const allurePlat = toNumber(input.allureMinRaw, 0) + toNumber(input.allureSecRaw, 0) / 60;
  const coeff = TERRAINS.find((t) => t.value === input.terrain)?.coeff ?? 1;

  const tempsPlatMin = distance * allurePlat;
  const tempsMonteeMin = (dPlus / 100) * MINUTES_PAR_100M_MONTEE * coeff;
  const tempsDescenteMin = (dMoins / 100) * MINUTES_PAR_100M_DESCENTE * coeff;
  const tempsTotalMin = tempsPlatMin + tempsMonteeMin + tempsDescenteMin;

  return {
    distance, dPlus, dMoins, allurePlat, coeff,
    tempsPlatMin, tempsMonteeMin, tempsDescenteMin, tempsTotalMin,
    allureEquivalenteMinParKm: distance > 0 ? tempsTotalMin / distance : 0,
    tempsOptimisteMin: tempsTotalMin * 0.9,
    tempsPessimisteMin: tempsTotalMin * 1.1,
    valide: distance > 0 && allurePlat > 0,
  };
}

export function formatDuree(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return "—";
  const totalSec = Math.round(minutes * 60);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")}`;
  const s = totalSec % 60;
  return `${m} min ${String(s).padStart(2, "0")}`;
}

export function formatAllure(minParKm: number): string {
  if (!Number.isFinite(minParKm) || minParKm <= 0) return "—";
  const totalSec = Math.round(minParKm * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}'${String(s).padStart(2, "0")}/km`;
}
