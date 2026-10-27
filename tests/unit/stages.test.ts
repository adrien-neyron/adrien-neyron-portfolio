import { describe, it, expect } from 'vitest'
import { buildStageView, normalizeStage, keyResult, stageOfProject, isListedProject, projectType, projectHref, placementOptions, placementOf, orderForPlacement, validateStage, stageKeyFromTitle, PLACE_START } from '~/utils/stages'
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
    expect(projectType({ slug: 'job-search-automator' })).toBeNull()
  })
  it('publiée = un type et défi, solution, résultat tous renseignés', () => {
    expect(isListedProject({ slug: 'dgfip-outil-metier', ...full })).toBe(true)
    expect(isListedProject({ slug: 'stockpulse', challenge: 'c' })).toBe(false)
    expect(isListedProject({ slug: 'job-search-automator', ...full })).toBe(false)   // pas de type
    expect(isListedProject({ slug: 'Mode-Dressing' })).toBe(false)
  })
})

describe('emplacement d\'une étape (saisie admin)', () => {
  const mk = (key: string, order: number, kind: 'depart' | 'etape' | 'bivouac' | 'final' = 'etape', title = key) =>
    ({ key, order, kind, title, period: '' })
  const trace = [mk('depart', 0, 'depart', 'UCPA'), mk('e1', 1), mk('biv', 2, 'bivouac'), mk('e2', 3), mk('final', 4, 'final')]

  it('propose « Après … » pour chaque étape sauf le cairn final, avec le libellé calculé', () => {
    const o = placementOptions(trace)
    expect(o.map((x) => x.value)).toEqual(['depart', 'e1', 'biv', 'e2'])
    expect(o[0].label).toBe('Après « Départ · UCPA »')
    expect(o[1].label).toBe('Après « Étape 01 · e1 »')
    expect(o[2].label).toBe('Après « Bivouac · biv »')
  })
  it('propose le début de la trace tant qu\'il n\'y a pas de Départ', () => {
    expect(placementOptions([mk('e1', 1)])[0].value).toBe(PLACE_START)
  })
  it('le numéro découle de l\'emplacement : une étape glissée après e1 devient l\'Étape 02 et décale la suivante', () => {
    const order = orderForPlacement(trace, 'etape', 'e1')!
    expect(order).toBeGreaterThan(1)
    expect(order).toBeLessThan(2)
    const v = buildStageView([...trace, mk('new', order)])
    expect(v.find((x) => x.key === 'new')!.label).toBe('Étape 02')
    expect(v.find((x) => x.key === 'e2')!.label).toBe('Étape 03')
  })
  it('départ avant tout, cairn final après tout, emplacement inconnu ou après le final refusé', () => {
    expect(orderForPlacement(trace, 'depart', '')).toBeLessThan(0)
    expect(orderForPlacement(trace, 'final', '')).toBeGreaterThan(4)
    expect(orderForPlacement(trace, 'etape', 'inconnu')).toBeNull()
    expect(orderForPlacement(trace, 'etape', 'final')).toBeNull()
  })
  it('retrouve l\'emplacement actuel d\'une étape existante', () => {
    expect(placementOf(trace.filter((s) => s.key !== 'e2'), 3)).toBe('biv')
    expect(placementOf(trace, 0)).toBe(PLACE_START)
  })
  it('clé proposée : type + titre sans accent ; départ et final fixes', () => {
    expect(stageKeyFromTitle('etape', 'Développeur web — Haute-Savoie !')).toBe('etape-developpeur-web-haute-savoie')
    expect(stageKeyFromTitle('depart', 'x')).toBe('depart')
    expect(stageKeyFromTitle('etape', '')).toBe('etape')
  })
})

describe('validation d\'une étape : messages explicites', () => {
  const mk = (key: string, order: number, kind: 'depart' | 'etape' | 'bivouac' | 'final' = 'etape', title = key) =>
    ({ key, order, kind, title, period: '' })
  const trace = [mk('depart', 0, 'depart', 'UCPA'), mk('e1', 1, 'etape', 'Freelance')]
  const ok = { kind: 'etape' as const, title: 'DGFiP', key: 'etape-dgfip' }

  it('une étape complète passe', () => {
    expect(validateStage(ok, trace, 'e1')).toEqual([])
  })
  it('titre, clé et emplacement manquants : un message par champ, qui dit quoi faire', () => {
    const r = validateStage({ kind: 'etape', title: '  ', key: '' }, trace, '')
    expect(r.map((i) => i.field).sort()).toEqual(['key', 'placement', 'title'])
    expect(r.find((i) => i.field === 'placement')!.message).toMatch(/numéro de l'étape en découle/)
  })
  it('clé déjà utilisée : cite l\'étape qui la porte ; format invalide refusé', () => {
    const dup = validateStage({ ...ok, key: 'e1' }, trace, 'e1')
    expect(dup[0]).toMatchObject({ field: 'key' })
    expect(dup[0].message).toContain('Freelance')
    expect(validateStage({ ...ok, key: 'Étape 4' }, trace, 'e1')[0].message).toMatch(/minuscules sans accent/)
  })
  it('un seul Départ et un seul cairn final', () => {
    const r = validateStage({ kind: 'depart', title: 'Autre', key: 'depart-2' }, trace)
    expect(r[0]).toMatchObject({ field: 'kind' })
    expect(r[0].message).toContain('UCPA')
    expect(validateStage({ kind: 'final', title: 'Fin', key: 'final' }, trace)).toEqual([])
  })
  it('emplacement disparu : message dédié', () => {
    expect(validateStage(ok, trace, 'supprimee')[0].message).toMatch(/n'existe plus/)
  })
})
