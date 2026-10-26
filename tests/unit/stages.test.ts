import { describe, it, expect } from 'vitest'
import { buildStageView, normalizeStage, keyResult, stageOfProject, isListedProject, projectType, projectHref } from '~/utils/stages'
import { stages as fallback } from '~/data/stages'

const projects = [
  { slug: 'stockpulse', title: 'StockPulse' },
  { slug: 'dgfip-outil-metier', title: 'OCTAVE' },
  { slug: 'runfit-advisor', title: 'RunFit Advisor' },
  { slug: 'coachflow', title: 'CoachFlow' },
  { slug: 'click2sellsite-accessibilite', title: 'YepGarage' },
]

describe('buildStageView (source unique de la trace)', () => {
  const v = buildStageView(fallback, projects)

  it('4 étapes + bivouac + cairn final, dans l’ordre chronologique', () => {
    expect(v.map((s) => s.label)).toEqual(['Départ', 'Étape 01', 'Étape 02', 'Bivouac', 'Étape 03', 'Cairn final'])
    expect(v.map((s) => s.num)).toEqual([null, 1, 2, null, 3, null])
  })

  it('≈ 180 km et 10 200 m D+ répartis à parts égales entre les étapes ; le bivouac entre ses voisins', () => {
    expect(v.map((s) => s.km)).toEqual([0, 45, 90, 113, 135, 180])
    expect(v.map((s) => s.gain)).toEqual([0, 2550, 5100, 6380, 7650, 10200])
  })

  it('résultat clé = chiffre + libellé ; sans chiffre → rien (jamais inventé)', () => {
    expect(v[2].keyResult).toBe('−50 % de temps de traitement')
    expect(v[3].keyResult).toBe('')
    expect(keyResult({ figure: '', figureLabel: 'libellé seul' })).toBe('')
  })

  it('liens : seulement vers les fiches existantes ; cairn final → /contact', () => {
    expect(v[1].links.map((l) => l.slug)).toEqual(['stockpulse'])   // C+Paie et HelloStay absents de cette liste
    expect(v[3].links.map((l) => l.title)).toEqual(['RunFit Advisor', 'CoachFlow'])
    expect(v[5].href).toBe('/contact')
    expect(v[0].href).toBe('')
    expect(projectHref('Service-Gestion de paie')).toBe('/projects/Service-Gestion%20de%20paie')
  })

  it('ordre par `order`, quelle que soit la saisie', () => {
    const w = buildStageView([...fallback].reverse(), projects)
    expect(w.map((s) => s.key)).toEqual(v.map((s) => s.key))
  })

  it('stageOfProject retrouve l’étape d’une fiche', () => {
    expect(stageOfProject('dgfip-outil-metier', v)?.label).toBe('Étape 02')
    expect(stageOfProject('inconnu', v)).toBeNull()
    expect(stageOfProject(undefined, v)).toBeNull()
  })
})

describe('normalizeStage', () => {
  it('rogne les textes, écarte les slugs vides, type inconnu → étape', () => {
    const s = normalizeStage({ key: ' k ', order: '2' as unknown as number, kind: 'x' as never, title: ' T ', projects: [' a ', '', 3 as never] })
    expect(s).toMatchObject({ key: 'k', order: 2, kind: 'etape', title: 'T', projects: ['a'] })
  })
})

describe('fiches publiées sur /projects', () => {
  const full = { challenge: 'c', solution: 's', result: 'r' }
  it('type : saisi dans l’admin, sinon repli par slug', () => {
    expect(projectType({ slug: 'coachflow' })).toBe('perso')
    expect(projectType({ slug: 'coachflow', type: 'mission' })).toBe('mission')
    expect(projectType({ slug: 'dressmeup' })).toBe('perso')
    expect(projectType({ slug: 'job-search-automator' })).toBeNull()
  })
  it('publiée = un type et défi, solution, résultat tous renseignés', () => {
    expect(isListedProject({ slug: 'dgfip-outil-metier', ...full })).toBe(true)
    expect(isListedProject({ slug: 'dressmeup', ...full })).toBe(true)
    expect(isListedProject({ slug: 'stockpulse', challenge: 'c' })).toBe(false)
    expect(isListedProject({ slug: 'job-search-automator', ...full })).toBe(false)   // pas de type
    expect(isListedProject({ slug: 'Mode-Dressing' })).toBe(false)
  })
})
