import { describe, it, expect } from 'vitest'
import { createWheelGate, wheelGate, STEP_MS } from '~/utils/wheelStep'

/** Rejoue une suite d'événements [t (ms), deltaY] et compte les passages de projet. */
function replay(events: [number, number][], hasTarget: (d: 1 | -1) => boolean = () => true) {
  const g = createWheelGate()
  const steps: number[] = []
  const actions = events.map(([t, dy]) => {
    const a = wheelGate(g, t, dy, hasTarget)
    if (a.type === 'step') steps.push(a.dir)
    return a.type
  })
  return { steps, actions }
}

/** Rafale de pavé tactile : un événement toutes les 16 ms, delta décroissant (inertie). */
function trackpad(start: number, durationMs: number, sign = 1): [number, number][] {
  const n = Math.round(durationMs / 16)
  return Array.from({ length: n }, (_, k) => [start + k * 16, sign * Math.max(1, 34 * (1 - k / n))] as [number, number])
}

describe('utils/wheelStep : un cran = un projet', () => {
  it('un cran de molette fait passer un seul projet', () => {
    expect(replay([[0, 100]]).steps).toEqual([1])
  })

  it('des crans espacés font passer un projet chacun', () => {
    const t = STEP_MS + 400
    expect(replay([[0, 100], [t, 100], [2 * t, 100], [3 * t, -100]]).steps).toEqual([1, 1, 1, -1])
  })

  it('une rafale de pavé tactile (0,7 s) ne fait passer qu’un projet', () => {
    expect(replay(trackpad(0, 700)).steps).toEqual([1])
  })

  it('une inertie plus longue que la transition (2 s) ne fait toujours passer qu’un projet', () => {
    expect(replay(trackpad(0, 2000)).steps).toEqual([1])
  })

  it('un nouveau geste après la fin de l’inertie fait passer le projet suivant', () => {
    const first = trackpad(0, 1600)
    const end = first[first.length - 1][0]
    const second = trackpad(end + 400, 600)
    expect(replay([...first, ...second]).steps).toEqual([1, 1])
  })

  it('les crans donnés pendant une transition sont absorbés', () => {
    const r = replay([[0, 100], [200, 100], [500, 100]])
    expect(r.steps).toEqual([1])
    expect(r.actions).toEqual(['step', 'swallow', 'swallow'])
  })

  it('un petit mouvement isolé n’avance pas, mais n’est pas laissé à la page', () => {
    expect(replay([[0, 8]]).actions).toEqual(['swallow'])
  })

  it('au bout de la carte, la page défile normalement', () => {
    const r = replay([[0, 100], [50, 100]], (d) => d < 0)
    expect(r.steps).toEqual([])
    expect(r.actions).toEqual(['pass', 'pass'])
  })
})
