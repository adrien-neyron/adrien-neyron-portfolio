import { describe, it, expect } from 'vitest'
import { computePace, toNumber, formatDuree, formatAllure, type PaceInput } from '~/utils/allure'

const base: PaceInput = { distanceRaw: '20', denivelePositifRaw: '800', deniveleNegatifRaw: '', allureMinRaw: '6', allureSecRaw: '00', terrain: 'modere' }

describe('toNumber', () => {
  it('accepte la virgule décimale française', () => expect(toNumber('12,5')).toBe(12.5))
  it('rejette négatif, vide, texte → repli', () => {
    expect(toNumber('-3', 7)).toBe(7); expect(toNumber('', 7)).toBe(7); expect(toNumber('abc', 7)).toBe(7)
  })
})

describe('computePace', () => {
  it('cas de référence : 20 km, 800 m D+ (D- = D+), 6\'00/km, terrain modéré', () => {
    const r = computePace(base)
    expect(r.tempsPlatMin).toBe(120)
    expect(r.tempsMonteeMin).toBeCloseTo(64)       // 8 min / 100 m
    expect(r.tempsDescenteMin).toBeCloseTo(16)     // 2 min / 100 m
    expect(r.tempsTotalMin).toBeCloseTo(200)
    expect(r.allureEquivalenteMinParKm).toBeCloseTo(10)
    expect(r.tempsOptimisteMin).toBeCloseTo(180); expect(r.tempsPessimisteMin).toBeCloseTo(220)
    expect(r.valide).toBe(true)
  })
  it('un D- saisi remplace le « D- = D+ » par défaut', () => {
    expect(computePace({ ...base, deniveleNegatifRaw: '0' }).tempsDescenteMin).toBe(0)
    expect(computePace({ ...base, deniveleNegatifRaw: '400' }).tempsDescenteMin).toBeCloseTo(8)
  })
  it('le terrain module monté et descente, pas le plat', () => {
    const f = computePace({ ...base, terrain: 'facile' }), t = computePace({ ...base, terrain: 'technique' })
    expect(f.tempsPlatMin).toBe(t.tempsPlatMin)
    expect(f.tempsTotalMin).toBeLessThan(t.tempsTotalMin)
    expect(t.tempsMonteeMin).toBeCloseTo(64 * 1.3)
  })
  it('plus de D+ = toujours plus long (monotonie)', () => {
    const a = computePace({ ...base, denivelePositifRaw: '0' }).tempsTotalMin
    const b = computePace({ ...base, denivelePositifRaw: '1500' }).tempsTotalMin
    expect(b).toBeGreaterThan(a)
  })
  it('entrées vides ou invalides : pas de NaN, résultat non valide', () => {
    const r = computePace({ ...base, distanceRaw: '', allureMinRaw: 'x', allureSecRaw: '' })
    expect(r.valide).toBe(false)
    Object.values(r).filter((v) => typeof v === 'number').forEach((v) => expect(Number.isNaN(v)).toBe(false))
  })
  it('allure en secondes : 5\'30 = 5,5 min/km', () => {
    expect(computePace({ ...base, allureMinRaw: '5', allureSecRaw: '30' }).allurePlat).toBeCloseTo(5.5)
  })
})

describe('formatage', () => {
  it('formatDuree', () => {
    expect(formatDuree(200)).toBe('3 h 20')
    expect(formatDuree(5.5)).toBe('5 min 30')
    expect(formatDuree(-1)).toBe('—'); expect(formatDuree(NaN)).toBe('—')
  })
  it('formatAllure', () => {
    expect(formatAllure(10)).toBe("10'00/km")
    expect(formatAllure(5.5)).toBe("5'30/km")
    expect(formatAllure(0)).toBe('—')
  })
})
