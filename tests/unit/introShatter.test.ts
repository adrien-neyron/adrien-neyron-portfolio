import { describe, it, expect } from 'vitest'
import { buildShards, buildMesh, polygonArea, rng } from '../../utils/introShatter'

describe('transition en éclats : maillage', () => {
  for (const aspect of [0.5, 1.6, 2.4]) {
    it(`les éclats couvrent exactement l'écran (aspect ${aspect})`, () => {
      const shards = buildShards(aspect)
      const total = shards.reduce((s, sh) => s + polygonArea(sh.poly), 0)
      expect(total).toBeCloseTo(4 * aspect, 6) // aucun trou, aucun recouvrement
      expect(shards.length).toBeGreaterThan(40)
    })
  }

  it('chaque éclat est un polygone convexe orienté dans le sens trigonométrique', () => {
    for (const sh of buildShards(1.6)) {
      expect(polygonArea(sh.poly)).toBeGreaterThan(0)
      const n = sh.poly.length
      for (let i = 0; i < n; i++) {
        const [ax, ay] = sh.poly[i]
        const [bx, by] = sh.poly[(i + 1) % n]
        const [cx, cy] = sh.poly[(i + 2) % n]
        expect((bx - ax) * (cy - by) - (by - ay) * (cx - bx)).toBeGreaterThan(-1e-9)
      }
    }
  })

  it('est déterministe : mêmes éclats à chaque appel', () => {
    expect(buildShards(1.6, 95, 7)).toEqual(buildShards(1.6, 95, 7))
    expect(rng(3)()).toBe(rng(3)())
  })

  it('le maillage a 8 flottants par sommet et un nombre de sommets multiple de 3', () => {
    const { data, vertexCount } = buildMesh(buildShards(1.6))
    expect(vertexCount % 3).toBe(0)
    expect(data.length).toBe(vertexCount * 8)
  })
})
