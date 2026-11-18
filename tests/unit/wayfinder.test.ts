import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { wfName, shorten, viseurBox, inView, trailPath, trailCtrl, sampleCurve, edgeAnchor, knockRuns, dropShort, labelPlace, isNavKey, center, cornerSize, moveKind, visibleText, needsLabel, WF_PAD, WF_NAME_MAX, WF_TRAIL_MIN, WF_EDGE_GAP, type NameSource } from '~/utils/wayfinder'

/** Faux élément : seulement ce que wfName lit. */
const el = (attrs: Record<string, string> = {}, text = '', extra: Partial<NameSource> = {}): NameSource => ({
  getAttribute: (n) => attrs[n] ?? null, textContent: text, ...extra,
})

describe('WAYFINDER : nom de la destination', () => {
  it('ordre : aria-labelledby, aria-label, <label>, texte, title, alt, placeholder', () => {
    const doc = { getElementById: (id: string) => ({ a: { textContent: 'Titre' }, b: { textContent: ' du panneau ' } } as Record<string, { textContent: string }>)[id] ?? null }
    expect(wfName(el({ 'aria-labelledby': 'a b', 'aria-label': 'X' }, 'Y', { ownerDocument: doc }))).toBe('Titre du panneau')
    expect(wfName(el({ 'aria-label': 'Lancer la visite' }, 'Visite'))).toBe('Lancer la visite')
    expect(wfName(el({}, '', { labels: [{ textContent: ' Votre e-mail ' }] }))).toBe('Votre e-mail')
    expect(wfName(el({}, '  01\n  RunFit   Advisor '))).toBe('01 RunFit Advisor')
    expect(wfName(el({ title: 'Admin' }, ''))).toBe('Admin')
    expect(wfName(el({}, '', { querySelector: () => ({ getAttribute: () => 'Logo Cordée' }) }))).toBe('Logo Cordée')
    expect(wfName(el({ placeholder: 'Rechercher' }, ''))).toBe('Rechercher')
    expect(wfName(el())).toBe('')
  })
  it('coupe un nom trop long avec une ellipse', () => {
    const long = 'x'.repeat(80)
    expect(shorten(long)).toHaveLength(WF_NAME_MAX)
    expect(shorten(long).endsWith('…')).toBe(true)
    expect(shorten('court')).toBe('court')
  })
})

describe('WAYFINDER : géométrie', () => {
  it('le viseur entoure l’élément avec une marge', () => {
    expect(viseurBox({ left: 100, top: 50, width: 80, height: 40 })).toEqual({ x: 100 - WF_PAD, y: 50 - WF_PAD, w: 80 + 2 * WF_PAD, h: 40 + 2 * WF_PAD })
    expect(center({ x: 0, y: 0, w: 10, h: 20 })).toEqual({ x: 5, y: 10 })
  })
  it('caché si l’élément est hors de la fenêtre ou sans taille', () => {
    expect(inView(viseurBox({ left: 10, top: 10, width: 50, height: 20 }), 800, 600)).toBe(true)
    expect(inView(viseurBox({ left: 10, top: 700, width: 50, height: 20 }), 800, 600)).toBe(false)
    expect(inView(viseurBox({ left: 10, top: 10, width: 0, height: 0 }), 800, 600)).toBe(false)
  })
  it('tronçon de trace : une courbe de a vers b', () => {
    const d = trailPath({ x: 0, y: 0 }, { x: 100, y: 0 })
    expect(d).toMatch(/^M0 0Q50 18 100 0$/)   // écart = 18 % de la distance
    expect(trailPath({ x: 0, y: 0 }, { x: 1000, y: 0 })).toContain('Q500 60 ')   // écart plafonné à 60 px
  })
  it('le nom passe sous le viseur en haut de page et s’aligne à droite près du bord', () => {
    expect(labelPlace({ x: 10, y: 5, w: 50, h: 30 }, 1000)).toEqual({ below: true, right: false })
    expect(labelPlace({ x: 900, y: 200, w: 50, h: 30 }, 1000)).toEqual({ below: false, right: true })
  })
  it('touches de navigation reconnues (aucune n’est interceptée)', () => {
    for (const k of ['Tab', 'ArrowRight', 'Home', 'End', 'Enter', ' ', 'Escape']) expect(isNavKey(k)).toBe(true)
    expect(isNavKey('a')).toBe(false)
  })
})

/** Faux nœud DOM minimal pour visibleText / needsLabel. */
type FakeNode = { nodeType: number; textContent?: string; childNodes: FakeNode[]; attrs?: Record<string, string>; cls?: string[]; tag?: string; forEach?: never }
const txt = (t: string): FakeNode => ({ nodeType: 3, textContent: t, childNodes: [] })
const node = (tag: string, kids: FakeNode[] = [], attrs: Record<string, string> = {}, cls: string[] = []): any => ({
  nodeType: 1, tag, childNodes: kids, attrs, cls,
  getAttribute: (n: string) => attrs[n] ?? null, hasAttribute: (n: string) => n in attrs,
  classList: { contains: (c: string) => cls.includes(c) },
  matches: (sel: string) => sel.split(',').some((x) => x.trim() === tag),
})
const fix = (n: any): any => { n.childNodes = (n.childNodes || []).map(fix); if (n.nodeType === 3) return n; return n }

describe('WAYFINDER : cohérence (un seul indicateur, pas de doublon)', () => {
  it('texte visible : sans .sr-only ni aria-hidden', () => {
    const el = fix(node('button', [node('span', [txt('01')]), node('span', [txt(' RunFit')], {}, ['sr-only']), node('svg', [txt('x')], { 'aria-hidden': 'true' })]))
    expect(visibleText(el)).toBe('01')
  })
  it('nom affiché seulement s’il n’est écrit nulle part ailleurs', () => {
    expect(needsLabel(fix(node('a', [node('svg', [], { 'aria-hidden': 'true' })], { 'aria-label': 'GitHub' })))).toBe(true)    // bouton-icône
    expect(needsLabel(fix(node('a', [txt('Aller au contenu')])))).toBe(false)                                                   // texte déjà visible
    expect(needsLabel(fix(node('button', [node('svg', [], { 'aria-hidden': 'true' })], { 'data-tip': 'Mentions légales' })))).toBe(false)   // a sa propre infobulle
    expect(needsLabel(fix(node('button', [], { 'aria-describedby': 'tip' })))).toBe(false)                                        // décrit ailleurs (carte du cadran)
    expect(needsLabel(fix(node('input', [], {})))).toBe(false)                                                                    // champ : son libellé est visible
  })
  it('équerres : 10 px, réduites sur un petit élément (6 px au moins)', () => {
    expect(cornerSize({ x: 0, y: 0, w: 200, h: 56 })).toBe(10)
    expect(cornerSize({ x: 0, y: 0, w: 30, h: 24 })).toBeCloseTo(7.2)
    expect(cornerSize({ x: 0, y: 0, w: 10, h: 10 })).toBe(6)
  })
  it('deux mouvements : glisser vers un voisin, verrouiller au loin', () => {
    const vw = 1440, vh = 900   // diagonale ≈ 1697 px : glisse jusqu'à ≈ 764 px
    expect(moveKind({ x: 0, y: 0 }, { x: 300, y: 0 }, vw, vh).kind).toBe('glide')
    expect(moveKind({ x: 100, y: 20 }, { x: 900, y: 860 }, vw, vh).kind).toBe('jump')
  })
  it('trace : bien visible à chaque déplacement, sauf entre voisins collés, dans un groupe d’onglets, ou d’un bout à l’autre de l’écran', () => {
    const vw = 1440, vh = 900
    expect(moveKind({ x: 0, y: 0 }, { x: 300, y: 0 }, vw, vh, false, 200).trail).toBe(true)                 // même zone (en-tête) : tracée aussi
    expect(moveKind({ x: 100, y: 20 }, { x: 900, y: 860 }, vw, vh, false, 1000).trail).toBe(true)           // saut lointain mais lisible
    expect(moveKind({ x: 0, y: 0 }, { x: 60, y: 0 }, vw, vh, false, WF_TRAIL_MIN - 1).trail).toBe(false)    // voisins collés
    expect(moveKind({ x: 0, y: 0 }, { x: 300, y: 0 }, vw, vh, true, 200).trail).toBe(false)                 // onglets : la sélection le montre déjà
    expect(moveKind({ x: 0, y: 0 }, { x: 1400, y: 890 }, vw, vh, false, 1500).trail).toBe(false)           // diagonale entière
  })
})

describe('WAYFINDER : la trace ne coupe aucune information', () => {
  it('part et arrive sur le bord des éléments, un peu à l’extérieur (jamais dedans)', () => {
    const box = { x: 100, y: 100, w: 200, h: 40 }
    expect(edgeAnchor(box, { x: 1000, y: 120 })).toEqual({ x: 300 + WF_EDGE_GAP, y: 120 })   // à droite
    expect(edgeAnchor(box, { x: 200, y: 900 })).toEqual({ x: 200, y: 140 + WF_EDGE_GAP })     // en dessous
    const p = edgeAnchor(box, { x: 900, y: 700 })
    expect(p.x >= box.x + box.w || p.y >= box.y + box.h).toBe(true)
  })
  it('deux courbes possibles, de part et d’autre de la ligne droite', () => {
    const a = { x: 0, y: 0 }, b = { x: 100, y: 0 }
    expect(trailCtrl(a, b, 1).y).toBe(18)
    expect(trailCtrl(a, b, -1).y).toBe(-18)
    expect(trailPath(a, b, -1)).toBe('M0 0Q50 -18 100 0')
  })
  it('échantillonne la courbe régulièrement, du départ à l’arrivée', () => {
    const pts = sampleCurve({ x: 0, y: 0 }, { x: 100, y: 0 })
    expect(pts[0]).toEqual({ x: 0, y: 0 }); expect(pts.at(-1)).toEqual({ x: 100, y: 0 })
    expect(pts.length).toBeGreaterThan(20)
  })
  it('pas de miettes : un bout de trace de moins de 3 points entre deux coupures est effacé aussi', () => {
    const F = false, T = true
    expect(dropShort([F, F, F, T, F, F, T, F, F, F])).toEqual([F, F, F, T, T, T, T, F, F, F])
    expect(dropShort([F, F])).toEqual([F, F])   // trajet libre et court : gardé
    expect(dropShort([T, F, T])).toEqual([T, T, T])
  })
  it('regroupe les points couverts en tronçons à effacer', () => {
    const pts = [0, 1, 2, 3, 4, 5].map((x) => ({ x, y: 0 }))
    expect(knockRuns(pts, [false, true, true, false, true, false]).map((r) => r.map((p) => p.x))).toEqual([[1, 2], [4]])
    expect(knockRuns(pts, pts.map(() => false))).toEqual([])
  })
})

describe('WAYFINDER : règles du code', () => {
  const src = readFileSync(new URL('../../utils/wayfinder.ts', import.meta.url), 'utf8')
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')   // le code seul, sans les commentaires
  it('n’intercepte aucune touche et ne pose aucun tabindex', () => {
    expect(code).not.toMatch(/preventDefault|stopPropagation|stopImmediatePropagation/)
    expect(code).not.toMatch(/\.tabIndex\s*=(?!=)|setAttribute\(\s*['"]tabindex/i)   // lire tabIndex est permis, le poser non
  })
  it('calque décoratif : aria-hidden, sans clic, mouvement réduit respecté', () => {
    const css = readFileSync(new URL('../../assets/css/wayfinder.css', import.meta.url), 'utf8')
    expect(src).toContain("setAttribute('aria-hidden', 'true')")
    expect(css).toMatch(/\.wf \{[^}]*pointer-events: none/)
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*\.wf-trail \{ display: none/)
  })
  it('un seul indicateur : le contour natif s’efface derrière le viseur, sauf en contraste élevé', () => {
    const css = readFileSync(new URL('../../assets/css/wayfinder.css', import.meta.url), 'utf8')
    expect(css).toMatch(/@media \(forced-colors: none\) \{\s*html\.wf-on :focus-visible \{ outline-color: transparent !important; \}/)
    expect(src).toContain("root.classList.toggle('wf-on', on)")
  })
  it('aucun tabindex positif dans le balisage de l’accueil', () => {
    const html = readFileSync(new URL('../../assets/loop/loop.html', import.meta.url), 'utf8')
    expect(html).not.toMatch(/tabindex="[1-9]/)
  })
})
