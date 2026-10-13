import { describe, it, expect } from 'vitest'
import { projects } from '~/data/projects'
import { carnetArticles } from '~/data/carnet'
import { aiTools } from '~/data/ai-tools'

/** Les données statiques servent de repli ET de graine de l'admin : une donnée cassée = page cassée en prod. */
const unique = (a: string[]) => new Set(a).size === a.length
const isUrl = (u: string) => /^(https?:\/\/|\/)[^\s]+$/.test(u)

describe('data/projects.ts', () => {
  it('slugs uniques et non vides', () => expect(unique(projects.map((p) => p.id))).toBe(true))
  it.each(projects.map((p) => [p.id, p] as const))('%s : champs obligatoires renseignés', (_, p) => {
    for (const k of ['title', 'tagline', 'role', 'description', 'challenge', 'solution', 'result'] as const) expect(p[k].trim(), k).not.toBe('')
    expect(p.technologies.length).toBeGreaterThan(0)
    expect(['Apprentissage', 'Side Project', 'Professionnel']).toContain(p.difficulty)
  })
  it.each(projects.map((p) => [p.id, p] as const))('%s : liens et coordonnées valides', (_, p) => {
    ;[p.link, p.code, p.cover, p.coverCreditUrl].filter(Boolean).forEach((u) => expect(isUrl(u!), u).toBe(true))
    if (p.coords) { expect(Math.abs(p.coords.lat)).toBeLessThanOrEqual(90); expect(Math.abs(p.coords.lon)).toBeLessThanOrEqual(180) }
    p.profile?.forEach((v) => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100) })
  })
})

describe('data/carnet.ts', () => {
  it('slugs uniques, catégories connues, dates ISO', () => {
    expect(unique(carnetArticles.map((a) => a.slug))).toBe(true)
    for (const a of carnetArticles) {
      expect(['Trail', 'Dev', 'Coulisses']).toContain(a.category)
      expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(a.content.length).toBeGreaterThan(50)
    }
  })
})

describe('data/ai-tools.ts', () => {
  it('ids uniques, textes et cas d’usage renseignés', () => {
    expect(unique(aiTools.map((t) => t.id))).toBe(true)
    for (const t of aiTools) { expect(t.name).toBeTruthy(); expect(t.useCases.length).toBeGreaterThan(0); if (t.link) expect(isUrl(t.link)).toBe(true) }
  })
})
