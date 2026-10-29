import { describe, it, expect } from 'vitest'
import { hashString, seededRandom, defaultProfile, formatCoords, toParagraphs, contourPaths } from '~/utils/trail'

describe('utils/trail', () => {
  it('hashString est déterministe et sensible au contenu', () => {
    expect(hashString('runfit')).toBe(hashString('runfit'))
    expect(hashString('runfit')).not.toBe(hashString('coachflow'))
    expect(hashString('')).toBeGreaterThanOrEqual(0)
  })

  it('seededRandom donne la même suite pour la même graine, dans [0, 1[', () => {
    const a = seededRandom(42), b = seededRandom(42)
    const sa = Array.from({ length: 20 }, a), sb = Array.from({ length: 20 }, b)
    expect(sa).toEqual(sb)
    sa.forEach((v) => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1) })
  })

  it("defaultProfile : même slug = même profil (pas d'écart d'hydratation), valeurs bornées", () => {
    const p = defaultProfile('click2sell')
    expect(p).toEqual(defaultProfile('click2sell'))
    expect(p).toHaveLength(13)
    p.forEach((v) => { expect(v).toBeGreaterThanOrEqual(4); expect(v).toBeLessThanOrEqual(96) })
    expect(defaultProfile('autre')).not.toEqual(p)
    expect(defaultProfile('x', 5)).toHaveLength(5)
  })

  it('formatCoords gère hémisphères et valeurs absentes', () => {
    expect(formatCoords({ lat: 45.764, lon: 4.836 })).toBe('45.764° N · 4.836° E')
    expect(formatCoords({ lat: -33.9, lon: -70.6 })).toBe('33.900° S · 70.600° O')
    expect(formatCoords({ lat: 0, lon: 0 })).toBe('0.000° N · 0.000° E')
    expect(formatCoords({ lat: 45 })).toBeUndefined()
    expect(formatCoords(null)).toBeUndefined()
  })

  it('toParagraphs découpe sur les lignes vides et ignore le vide', () => {
    expect(toParagraphs('a\n\nb\n  \n c ')).toEqual(['a', 'b', 'c'])
    expect(toParagraphs('')).toEqual([])
    expect(toParagraphs(undefined)).toEqual([])
  })

  it('contourPaths : déterministe, et les courbes sont emboîtées (jamais croisées)', () => {
    const peaks = [{ x: 300, y: 200, a: 1, sx: 120, sy: 90 }]
    const a = contourPaths(600, 400, peaks, 8, { cell: 10 })
    expect(a).toEqual(contourPaths(600, 400, peaks, 8, { cell: 10 }))
    expect(a).toHaveLength(8)
    // boîte englobante de chaque niveau : strictement plus petite à mesure que l'altitude monte
    const box = (d: string) => {
      const n = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number)
      const xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2 === 1)
      return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    }
    for (let i = 1; i < a.length; i++) {
      const o = box(a[i - 1]), n = box(a[i])
      expect(n[0]).toBeGreaterThan(o[0]); expect(n[1]).toBeLessThan(o[1])
      expect(n[2]).toBeGreaterThan(o[2]); expect(n[3]).toBeLessThan(o[3])
    }
  })
})
