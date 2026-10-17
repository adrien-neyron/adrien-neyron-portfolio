/**
 * Carte des expériences : « un cran de défilement = un projet ».
 * Filtre pur des événements de molette (sans DOM, testable) : dit s'il faut laisser défiler la page,
 * absorber l'événement, ou passer au projet suivant / précédent.
 *
 * - Un cran de molette (≥ MIN_DELTA) lance tout de suite une transition.
 * - Un pavé tactile envoie une rafale de petits événements : ils s'additionnent jusqu'à MIN_DELTA, puis une seule transition part.
 * - Pendant la transition (STEP_MS) et tant que la traîne d'inertie continue (un événement moins de QUIET_MS après le précédent),
 *   tout est absorbé : jamais deux projets pour un seul geste.
 * - S'il n'y a plus de projet dans ce sens (bout de la carte), la page défile normalement.
 */
export const STEP_MS = 1100
export const QUIET_MS = 280
export const MIN_DELTA = 24
const RESET_MS = 250 // au-delà, les petits mouvements accumulés sont oubliés

export interface WheelGate {
  busy: number // horodatage jusqu'auquel on absorbe
  acc: number // déplacement accumulé du geste en cours
  last: number // horodatage du dernier événement
}

export type WheelAction = { type: 'pass' } | { type: 'swallow' } | { type: 'step'; dir: 1 | -1 }

export function createWheelGate(): WheelGate {
  return { busy: 0, acc: 0, last: -Infinity }
}

/** deltaY en pixels ; hasTarget(dir) : y a-t-il un projet dans ce sens ? */
export function wheelGate(g: WheelGate, now: number, deltaY: number, hasTarget: (dir: 1 | -1) => boolean): WheelAction {
  const sinceLast = now - g.last
  g.last = now
  if (now < g.busy) {
    g.busy = Math.max(g.busy, now + QUIET_MS)
    return { type: 'swallow' }
  }
  if (sinceLast > RESET_MS) g.acc = 0
  g.acc += deltaY
  const dir = Math.sign(g.acc) as 1 | -1 | 0
  if (!dir) return { type: 'pass' }
  if (!hasTarget(dir)) {
    g.acc = 0
    return { type: 'pass' }
  }
  if (Math.abs(g.acc) < MIN_DELTA) return { type: 'swallow' }
  g.acc = 0
  g.busy = now + STEP_MS
  return { type: 'step', dir }
}
