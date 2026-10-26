import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeEvent } from './setup'

const chain = (rows: unknown) => ({ sort: () => ({ lean: async () => rows }), lean: async () => rows })
const state: any = {}
vi.mock('~/server/lib/mongodb', () => ({ dbConnect: vi.fn(async () => { if (state.dbDown) throw new Error('db') }) }))
vi.mock('~/server/models/profile', () => ({ default: { findOne: () => chain(state.profile) } }))
vi.mock('~/server/models/project', () => ({ default: { find: () => chain(state.projects) } }))
vi.mock('~/server/models/carnetArticle', () => ({ default: { find: () => chain(state.articles) } }))
vi.mock('~/server/models/aiTool', () => ({ default: { find: () => chain(state.aiTools) } }))
vi.mock('~/server/models/stage', () => ({ default: { find: () => chain(state.stages) } }))

import handler from '~/server/api/loop-content.get'

beforeEach(() => {
  state.dbDown = false
  state.profile = {
    loopEyebrow: '  Eyebrow ', loopTitle: 'Titre', loopLede: 'Lede', loopLead: 'Lead', loopFacts: 'Facts', cvUrl: '/cv.pdf',
    loopDialName: 'ADRI N', loopDialRole: 'DEV', loopDialXpLabel: 'XP:', loopDialXpValue: '18 ANS',
    loopToolsEyebrow: 'Atelier', loopToolsTitle: 'Outils', loopToolsLede: 'Paragraphe',
    email: 'a@b.fr', bookingUrl: 'https://rdv.example',
    profiles: [{ network: 'LinkedIn', url: 'https://linkedin.com/in/x' }, { network: 'GitHub', url: 'https://github.com/x' }],
  }
  state.projects = [{ slug: 'p1', title: 'P1', technologies: ['Vue', ' ', 7], order: 1, stats: [{ value: ' −50 % ', label: 'de temps' }, { value: '', label: 'sans valeur' }], cover: ' /c.webp ', image: { light: ' /l.png ', dark: 7 } }]
  state.articles = [{ slug: 'a1', title: 'A1', date: '2026-01-01' }]
  state.aiTools = [{ slug: 't1', name: 'Claude', provider: 'Anthropic' }]
  state.stages = []
})

describe('GET /api/loop-content', () => {
  it('agrège profil, textes du cadran, étape S’équiper, contact, projets, carnet, outils IA', async () => {
    const e: any = makeEvent()
    const out: any = await (handler as any)(e)
    expect(out.hero).toEqual({ eyebrow: 'Eyebrow', title: 'Titre', lede: 'Lede' })      // rogné
    expect(out.dial).toEqual({ name: 'ADRI N', role: 'DEV', xpLabel: 'XP:', xpValue: '18 ANS' })
    expect(out.toolsHead).toEqual({ eyebrow: 'Atelier', title: 'Outils', lede: 'Paragraphe' })
    expect(out.profile).toEqual({ lead: 'Lead', facts: 'Facts', cvUrl: '/cv.pdf' })
    expect(out.contact).toEqual({ email: 'a@b.fr', linkedin: 'https://linkedin.com/in/x', github: 'https://github.com/x', rdv: 'https://rdv.example' })
    expect(out.projects[0].technologies).toEqual(['Vue'])                                // valeurs non textuelles / vides écartées
    expect(out.projects[0].stats).toEqual([{ value: '−50 %', label: 'de temps' }])       // chiffre sans valeur écarté, rien d'inventé
    expect(out.projects[0]).toMatchObject({ cover: '/c.webp', coverCredit: '', coverCreditUrl: '' })
    expect(out.projects[0].image).toEqual({ light: '/l.png', dark: '' })                  // captures : texte rogné, valeur non textuelle écartée
    expect(out.articles).toHaveLength(1)
    expect(out.aiTools[0]).toMatchObject({ name: 'Claude', provider: 'Anthropic' })
    expect(e.responseHeaders['cache-control']).toContain('s-maxage=60')
  })

  it('champs absents → chaînes vides (le repli du balisage prend le relais)', async () => {
    state.profile = { email: 'a@b.fr' }
    const out: any = await (handler as any)(makeEvent())
    expect(out.hero).toEqual({ eyebrow: '', title: '', lede: '' })
    expect(out.dial).toEqual({ name: '', role: '', xpLabel: '', xpValue: '' })
    expect(out.contact.linkedin).toBe('')
    expect(out.contact.rdv).toBe('')
  })

  it('aucun profil en base → blocs profil à null, pas d’erreur', async () => {
    state.profile = null
    const out: any = await (handler as any)(makeEvent())
    expect(out.hero).toBeNull(); expect(out.dial).toBeNull(); expect(out.toolsHead).toBeNull(); expect(out.contact).toBeNull()
    expect(out.projects).toHaveLength(1)
  })

  it('étapes : base vide → étapes par défaut (data/stages.ts), liens seulement vers les projets présents', async () => {
    state.projects = [{ slug: 'dgfip-outil-metier', title: 'OCTAVE' }]
    const out: any = await (handler as any)(makeEvent())
    expect(out.stages.map((s: any) => s.label)).toEqual(['Départ', 'Étape 01', 'Étape 02', 'Bivouac', 'Étape 03', 'Cairn final'])
    const e2 = out.stages.find((s: any) => s.label === 'Étape 02')
    expect(e2.links).toEqual([{ slug: 'dgfip-outil-metier', title: 'OCTAVE', href: '/projects/dgfip-outil-metier' }])
    expect(e2.keyResult).toBe('−50 % de temps de traitement')
    expect(out.stages.find((s: any) => s.label === 'Étape 01').links).toEqual([])   // StockPulse absent : pas de lien mort
  })

  it('étapes : celles de la base remplacent le repli', async () => {
    state.stages = [{ key: 'a', order: 0, kind: 'depart', title: 'A', projects: [] }, { key: 'z', order: 1, kind: 'final', title: 'Z' }]
    const out: any = await (handler as any)(makeEvent())
    expect(out.stages.map((s: any) => s.title)).toEqual(['A', 'Z'])
    expect(out.stages[1].href).toBe('/contact')
  })

  it('base indisponible → {} et no-store (jamais mis en cache), pas de 500', async () => {
    state.dbDown = true
    const e: any = makeEvent()
    expect(await (handler as any)(e)).toEqual({})
    expect(e.responseHeaders['cache-control']).toBe('no-store')
  })
})
