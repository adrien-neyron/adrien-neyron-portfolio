import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { wfName, shorten, viseurBox, inView, trailPath, labelPlace, isNavKey, center, WF_PAD, WF_NAME_MAX, type NameSource } from '~/utils/wayfinder'

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

describe('WAYFINDER : règles du code', () => {
  const src = readFileSync(new URL('../../utils/wayfinder.ts', import.meta.url), 'utf8')
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')   // le code seul, sans les commentaires
  it('n’intercepte aucune touche et ne pose aucun tabindex', () => {
    expect(code).not.toMatch(/preventDefault|stopPropagation|stopImmediatePropagation/)
    expect(code).not.toMatch(/tabIndex|tabindex/)
  })
  it('calque décoratif : aria-hidden, sans clic, mouvement réduit respecté', () => {
    const css = readFileSync(new URL('../../assets/css/wayfinder.css', import.meta.url), 'utf8')
    expect(src).toContain("setAttribute('aria-hidden', 'true')")
    expect(css).toMatch(/\.wf \{[^}]*pointer-events: none/)
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*\.wf-trail \{ display: none/)
  })
  it('aucun tabindex positif dans le balisage de l’accueil', () => {
    const html = readFileSync(new URL('../../assets/loop/loop.html', import.meta.url), 'utf8')
    expect(html).not.toMatch(/tabindex="[1-9]/)
  })
})
