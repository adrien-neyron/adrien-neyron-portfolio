/**
 * Carte des expériences : « un cran de défilement = un projet ».
 * Filtre pur des événements de molette (sans DOM, testable) : dit s'il faut laisser défiler la page,
 * absorber l'événement, ou passer au projet suivant / précédent.
 *
 * - Un cran de molette (≥ MIN_DELTA) lance tout de suite une transition.
 * - Un pavé tactile envoie une rafale de petits événements : ils s'additionnent jusqu'à MIN_DELTA, puis une seule transition part.
 * - Verrou court (LOCK_MS) après chaque transition : tout est absorbé, jamais deux projets pour un seul geste.
 * - Ensuite, la traîne d'inertie du pavé (événements rapprochés, de plus en plus petits) reste absorbée ;
 *   mais un NOUVEAU geste est reconnu tout de suite (pause, changement de sens, cran de molette, delta qui remonte)
 *   et relance une transition, même si l'inertie du précédent n'est pas finie. Sans cela, le 2e geste était
 *   avalé tant que l'inertie du 1er continuait : il fallait scroller plusieurs fois.
 * - S'il n'y a plus de projet dans ce sens (bout de la carte), la page défile normalement.
 */
export const STEP_MS = 600 // durée de la transition « un cran = un projet » : elle démarre tout de suite (ease-out)
export const LOCK_MS = 300 // absorption stricte après un pas ; au-delà, un nouveau geste peut interrompre la transition
export const QUIET_MS = 280 // une pause de cette durée = nouveau geste
export const MIN_DELTA = 24
const RESET_MS = 300 // au-delà, les petits mouvements accumulés sont oubliés
const NOTCH_GAP_MS = 90 // deux crans de molette sont séparés d'au moins ça ; l'inertie du pavé arrive toutes les ~16 ms
const RISE = 1.6 // un delta 1,6× plus fort que le précédent n'est plus de l'inertie
const FRESH_MIN = MIN_DELTA / 2 // sous ce delta, on ne peut pas distinguer un geste de la traîne

export interface WheelGate {
  busy: number // horodatage jusqu'auquel on absorbe tout
  acc: number // déplacement accumulé du geste en cours
  last: number // horodatage du dernier événement
  prev: number // |delta| du dernier événement
  dir: number // sens du dernier événement (-1, 0, 1)
  tail: boolean // un pas vient d'être fait : on absorbe la traîne d'inertie jusqu'à un nouveau geste
}

export type WheelAction = { type: 'pass' } | { type: 'swallow' } | { type: 'step'; dir: 1 | -1 }

export function createWheelGate(): WheelGate {
  return { busy: 0, acc: 0, last: -Infinity, prev: 0, dir: 0, tail: false }
}

/** deltaY en pixels ; hasTarget(dir) : y a-t-il un projet dans ce sens ? */
export function wheelGate(g: WheelGate, now: number, deltaY: number, hasTarget: (dir: 1 | -1) => boolean): WheelAction {
  const sinceLast = now - g.last
  const abs = Math.abs(deltaY)
  const sign = Math.sign(deltaY)
  const prevAbs = g.prev
  const prevDir = g.dir
  g.last = now
  g.prev = abs
  if (sign) g.dir = sign

  if (now < g.busy) return { type: 'swallow' }
  if (!sign) return { type: 'pass' }

  if (g.tail) {
    const fresh =
      sinceLast > QUIET_MS || // pause : l'inertie est finie
      (sign !== prevDir && abs >= FRESH_MIN) || // demi-tour
      (abs >= FRESH_MIN && abs > prevAbs * RISE) || // le delta remonte : nouveau coup de doigt
      (abs >= MIN_DELTA && sinceLast >= NOTCH_GAP_MS) // cran de molette
    if (!fresh) return { type: 'swallow' }
    g.tail = false
    g.acc = 0
  }

  if (sinceLast > RESET_MS || sign !== Math.sign(g.acc)) g.acc = 0
  g.acc += deltaY
  const dir = Math.sign(g.acc) as 1 | -1
  if (!hasTarget(dir)) {
    g.acc = 0
    return { type: 'pass' }
  }
  if (Math.abs(g.acc) < MIN_DELTA) return { type: 'swallow' }
  g.acc = 0
  g.busy = now + LOCK_MS
  g.tail = true
  return { type: 'step', dir }
}
