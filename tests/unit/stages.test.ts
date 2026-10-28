import { describe, it, expect } from 'vitest'
import { summaryHtml, summaryParagraphs, buildStageView, normalizeStage, keyResult, stageOfProject, isListedProject, projectType, projectHref, placementOptions, placementOf, normalizeImages, withStageDefaults, validateStageDisplay, STAGE_DISPLAY_MAP, moveWithinTrace, traceOrderError, isPinnedStage, orderForPlacement, validateStage, stageKeyFromTitle, PLACE_START } from '~/utils/stages'
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

describe('réorganiser la trace (glisser-déposer)', () => {
  const t = [
    { id: 'd', kind: 'depart' as const, title: 'UCPA' },
    { id: 'a', kind: 'etape' as const, title: 'A' },
    { id: 'b', kind: 'bivouac' as const, title: 'B' },
    { id: 'c', kind: 'etape' as const, title: 'C' },
    { id: 'f', kind: 'final' as const, title: 'Fin' },
  ]
  const ids = (l: { id: string }[]) => l.map((x) => x.id).join('')

  it('déplace une étape vers le haut ou le bas', () => {
    expect(ids(moveWithinTrace(t, 3, 1))).toBe('dcabf')
    expect(ids(moveWithinTrace(t, 1, 3))).toBe('dbcaf')
  })
  it('ne passe jamais devant le Départ ni derrière le Cairn final', () => {
    expect(ids(moveWithinTrace(t, 2, 0))).toBe('dbacf')
    expect(ids(moveWithinTrace(t, 1, 4))).toBe('dbcaf')
  })
  it('le Départ et le Cairn final ne se déplacent pas ; même position = liste inchangée', () => {
    expect(moveWithinTrace(t, 0, 2)).toBe(t)
    expect(moveWithinTrace(t, 4, 1)).toBe(t)
    expect(moveWithinTrace(t, 1, 1)).toBe(t)
    expect(isPinnedStage(t[0])).toBe(true)
  })
  it('le numéro suit la position après déplacement', () => {
    const moved = moveWithinTrace(t, 3, 1).map((s, i) => ({ key: s.id, order: i, kind: s.kind, title: s.title, period: '' }))
    const v = buildStageView(moved)
    expect(v.find((x) => x.key === 'c')!.label).toBe('Étape 01')
    expect(v.find((x) => x.key === 'a')!.label).toBe('Étape 02')
  })
  it('contrôle serveur de l\'ordre : Départ premier, Cairn final dernier', () => {
    expect(traceOrderError(t)).toBeNull()
    expect(traceOrderError([t[1], t[0], t[4]])).toMatch(/Départ/)
    expect(traceOrderError([t[0], t[4], t[1]])).toMatch(/Cairn final/)
  })
})

describe('informations affichées sur le cairn et dans la card', () => {
  const base = { key: 'k', order: 1, kind: 'etape' as const, title: 'T', period: '2021' }

  it('km, D+ et altitude saisis passent devant le calcul ; vides, ils sont calculés', () => {
    const v = buildStageView([{ ...base, order: 0, kind: 'depart' }, { ...base, key: 'a', order: 1 }, { ...base, key: 'b', order: 2, km: 77, gain: 4000, altitude: 1850 }, { ...base, key: 'f', order: 3, kind: 'final' }])
    expect(v[1].km).toBe(60)                       // 180 km × 1/3
    expect(v[2]).toMatchObject({ km: 77, gain: 4000, altitude: 1850 })
    expect(v[1].altitude).toBeNull()               // null : relevée sur le tracé GPS par la carte
  })
  it('ligne du bas du cairn : saisie, sinon chiffre clé, sinon fiches liées ; 4 au plus', () => {
    const proj = [{ slug: 'p', title: 'Projet P' }]
    expect(buildStageView([{ ...base, steleTags: ['A', 'B'], figure: '−50 %' }], proj)[0].steleTags).toEqual(['A', 'B'])
    expect(buildStageView([{ ...base, figure: '−50 %', figureLabel: 'de temps' }], proj)[0].steleTags).toEqual(['−50 % de temps'])
    expect(buildStageView([{ ...base, projects: ['p'] }], proj)[0].steleTags).toEqual(['Projet P'])
    expect(normalizeStage({ ...base, steleTags: ['1', '2', '3', '4', '5'] }).steleTags).toHaveLength(4)
  })
  it('texte du lien principal : saisi, sinon « Fiche … », sinon « Écrire la suite ensemble » au cairn final', () => {
    const proj = [{ slug: 'p', title: 'Projet P' }]
    expect(buildStageView([{ ...base, projects: ['p'] }], proj)[0].cta).toBe('Fiche Projet P')
    expect(buildStageView([{ ...base, projects: ['p'], ctaLabel: 'Lire le cas' }], proj)[0].cta).toBe('Lire le cas')
    expect(buildStageView([{ ...base, kind: 'final' }])[0].cta).toBe('Écrire la suite ensemble')
    expect(buildStageView([{ ...base }])[0].cta).toBe('')
  })
  it('images : 3 au plus, adresses valides seulement ; absent ≠ vide (défaut ou aucune)', () => {
    expect(normalizeImages([{ src: '/a.webp', title: 'A' }, { src: 'http://x/y.png' }, { src: '//evil/z.png' }, { src: 'https://x/y.png', title: ' B ' }, { src: '/c' }, { src: '/d' }])).toEqual([
      { src: '/a.webp', title: 'A' }, { src: 'https://x/y.png', title: 'B' }, { src: '/c', title: '' },
    ])
    expect('images' in normalizeStage(base)).toBe(false)
    expect(normalizeStage({ ...base, images: [] }).images).toEqual([])
  })
  it('étape de la base sans images : reprend celles de data/stages.ts ; images vides saisies : respectées', () => {
    const defaults = [{ ...base, images: [{ src: '/d.webp', title: 'D' }] }]
    expect(withStageDefaults({ key: 'k' }, defaults).images).toEqual([{ src: '/d.webp', title: 'D' }])
    expect(withStageDefaults({ key: 'k', images: [] }, defaults).images).toEqual([])
    expect(withStageDefaults({ key: 'autre' }, defaults).images).toBeUndefined()
  })
  it('contrôle des champs d\'affichage : nombres, 4 éléments, images', () => {
    expect(validateStageDisplay({ km: '12', gain: '', altitude: '1 850' }).map((i) => i.field)).toEqual(['altitude'])
    expect(validateStageDisplay({ km: '-3' })[0].message).toMatch(/nombre positif/)
    expect(validateStageDisplay({ steleTags: ['a', 'b', 'c', 'd', 'e'] })[0].field).toBe('steleTags')
    expect(validateStageDisplay({ images: [{ src: '', title: 'X' }] })[0].message).toMatch(/Image 1/)
    expect(validateStageDisplay({ images: [{ src: 'ftp://x', title: '' }] })[0].message).toMatch(/chemin du site/)
    expect(validateStageDisplay({ km: '10', images: [{ src: '/a.webp', title: '' }] })).toEqual([])
  })
  it('la table d\'aide couvre chaque champ saisissable, avec au moins un endroit d\'affichage', () => {
    const fields = STAGE_DISPLAY_MAP.flatMap((r) => r.field.split(',').map((f) => f.trim()))
    for (const f of ['title', 'place', 'period', 'km', 'gain', 'altitude', 'steleTags', 'summary', 'figure', 'figureLabel', 'images', 'projects', 'ctaLabel']) expect(fields).toContain(f)
    for (const r of STAGE_DISPLAY_MAP) expect(r.cairn || r.card || r.liste, r.info).toBe(true)
  })
})

describe('titre et période du cairn distincts de la card', () => {
  const base = { key: 'k', order: 1, kind: 'etape' as const, period: '2023 – 2025', title: 'DGFiP, mission via BeTeam' }
  it('vides : reprennent ceux de la card', () => {
    const v = buildStageView([base])[0]
    expect(v.steleTitle).toBe(base.title)
    expect(v.stelePeriod).toBe(base.period)
  })
  it('saisis : gravés sur le cairn sans toucher la card', () => {
    const v = buildStageView([{ ...base, steleTitle: 'DGFiP', stelePeriod: '2023' }])[0]
    expect(v.steleTitle).toBe('DGFiP')
    expect(v.stelePeriod).toBe('2023')
    expect(v.title).toBe(base.title)
    expect(v.period).toBe(base.period)
  })
  it('table d\'affichage : champs listés', () => {
    const fields = STAGE_DISPLAY_MAP.map((r) => r.field)
    expect(fields).toContain('steleTitle')
    expect(fields).toContain('stelePeriod')
  })
})

describe('mise en page du résumé', () => {
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  it('garde les paragraphes et les retours à la ligne', () => {
    expect(summaryParagraphs('Un\nDeux\n\nTrois')).toEqual([['Un', 'Deux'], ['Trois']])
    expect(summaryHtml('Un\nDeux\n\nTrois', esc)).toBe('<span class="par">Un<br>Deux</span><span class="par">Trois</span>')
    expect(summaryHtml('A\r\n\r\nB', esc, 'p')).toBe('<p>A</p><p>B</p>')
  })
  it("échappe le HTML venu de l'admin et ignore le vide", () => {
    expect(summaryHtml('<b>x</b>', esc)).toBe('<span class="par">&lt;b>x&lt;/b></span>')
    expect(summaryHtml('  \n\n ', esc)).toBe('')
    expect(summaryHtml(undefined, esc)).toBe('')
  })
})
