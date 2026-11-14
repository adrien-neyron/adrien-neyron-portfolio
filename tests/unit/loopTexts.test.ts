import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { LOOP_TEXT_DEFAULTS as d } from '~/data/loopTexts'
import { titleHtml } from '~/utils/loopMarkup'

const markup = readFileSync(new URL('../../assets/loop/loop.html', import.meta.url), 'utf8')

describe('textes de l’accueil affichés dans /admin', () => {
  it.each([
    ['<p class="eyebrow who">', d.loopEyebrow, '</p>'],
    ['<h1 id="h1">', titleHtml(d.loopTitle), '</h1>'],   // une phrase par ligne (titleHtml), comme le titre saisi dans /admin
    ['<p class="lede">', d.loopLede, '</p>'],
    ['<p class="eyebrow">', d.loopToolsEyebrow, '</p>'],
    ['<h2>', d.loopToolsTitle, '</h2>'],
    ['<p class="sub">', d.loopToolsLede, '</p>'],
  ])('loop.html contient %s avec le même texte', (open, text, close) => {
    expect(markup).toContain(open + text + close)
  })
})

describe('titre du hero : une phrase par ligne', () => {
  it('découpe après la ponctuation et échappe chaque phrase', () => {
    expect(titleHtml('Trouver le cap. Concevoir le chemin.')).toBe('<span class="ln">Trouver le cap.</span> <span class="ln">Concevoir le chemin.</span>')
    expect(titleHtml('A <b> & co ! Ensuite…  fin')).toBe('<span class="ln">A &lt;b&gt; &amp; co !</span> <span class="ln">Ensuite…</span> <span class="ln">fin</span>')
  })
  it('un titre sans ponctuation reste une ligne', () => {
    expect(titleHtml('  Trouver le cap  ')).toBe('<span class="ln">Trouver le cap</span>')
  })
})
