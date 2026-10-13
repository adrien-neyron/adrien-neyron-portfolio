import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { applyLoopContent, swap, escHtml } from '~/utils/loopMarkup'

const markup = readFileSync(new URL('../../assets/loop/loop.html', import.meta.url), 'utf8')

describe('loop.html : contrat avec les champs « Accueil » de l’admin', () => {
  // Si une de ces balises est renommée, l’admin n’agit plus sur l’accueil sans aucune erreur visible.
  it.each([
    '<p class="eyebrow who">', '<h1 id="h1">', '<p class="lede">', '<p class="gate-tag">',
    'id="head2"', '<p class="eyebrow">', '<h2>', '<p class="sub">',
  ])('contient %s', (tag) => { expect(markup).toContain(tag) })

  it('a le bloc « S’équiper » (#head2) avec surtitre, titre et paragraphe', () => {
    const i = markup.indexOf('id="head2"')
    const block = markup.slice(i, markup.indexOf('</div>', i))
    expect(block).toMatch(/<p class="eyebrow">[^<]+<\/p>/)
    expect(block).toMatch(/<h2>[^<]+<\/h2>/)
    expect(block).toMatch(/<p class="sub">[^<]+<\/p>/)
  })
})

describe('applyLoopContent', () => {
  it('sans contenu, le balisage est inchangé', () => {
    expect(applyLoopContent(markup, null)).toBe(markup)
    expect(applyLoopContent(markup, {})).toBe(markup)
    expect(applyLoopContent(markup, { hero: { eyebrow: '  ', title: '', lede: undefined } })).toBe(markup)
  })

  it('remplace surtitre, titre (h1 + écran de la corde) et sous-texte', () => {
    const out = applyLoopContent(markup, { hero: { eyebrow: 'Eyebrow X', title: 'Titre X', lede: 'Lede X' } })
    expect(out).toContain('<p class="eyebrow who">Eyebrow X</p>')
    expect(out).toContain('<h1 id="h1">Titre X</h1>')
    expect(out).toContain('<p class="lede">Lede X</p>')
    expect(out).toContain('<p class="gate-tag">Titre X</p>')
  })

  it('remplace le bloc S’équiper sans toucher aux autres surtitres', () => {
    const out = applyLoopContent(markup, { toolsHead: { eyebrow: 'Atelier X', title: 'Outils X', lede: 'Para X' } })
    const i = out.indexOf('id="head2"')
    expect(out.slice(i)).toContain('<p class="eyebrow">Atelier X</p>')
    expect(out.slice(i)).toContain('<h2>Outils X</h2>')
    expect(out.slice(i)).toContain('<p class="sub">Para X</p>')
    expect(out.slice(0, i)).toBe(markup.slice(0, i)) // rien avant #head2 n’a bougé
  })

  it('un champ vide garde le texte par défaut du champ voisin', () => {
    const out = applyLoopContent(markup, { toolsHead: { title: 'Seul le titre' } })
    expect(out).toContain('<h2>Seul le titre</h2>')
    expect(out).toContain("S'équiper · Atelier")
  })

  it('échappe le HTML saisi (pas d’injection)', () => {
    const out = applyLoopContent(markup, { hero: { title: '<img src=x onerror=alert(1)> & "ok"' } })
    expect(out).not.toContain('<img src=x')
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;ok&quot;')
  })
})

describe('swap / escHtml', () => {
  it('swap ignore une balise absente', () => {
    expect(swap('<b>a</b>', '<i>', '</i>', 'x')).toBe('<b>a</b>')
  })
  it('swap ne remplace que la première occurrence', () => {
    expect(swap('<p>1</p><p>2</p>', '<p>', '</p>', 'X')).toBe('<p>X</p><p>2</p>')
  })
  it('escHtml échappe & < > "', () => {
    expect(escHtml(`&<>"`)).toBe('&amp;&lt;&gt;&quot;')
  })
})
