import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { LOOP_TEXT_DEFAULTS as d } from '~/data/loopTexts'

const markup = readFileSync(new URL('../../assets/loop/loop.html', import.meta.url), 'utf8')

describe('textes de l’accueil affichés dans /admin', () => {
  it.each([
    ['<p class="eyebrow who">', d.loopEyebrow, '</p>'],
    ['<h1 id="h1">', d.loopTitle, '</h1>'],
    ['<p class="lede">', d.loopLede, '</p>'],
    ['<p class="gate-tag">', d.loopTitle, '</p>'],
    ['<p class="eyebrow">', d.loopToolsEyebrow, '</p>'],
    ['<h2>', d.loopToolsTitle, '</h2>'],
    ['<p class="sub">', d.loopToolsLede, '</p>'],
  ])('loop.html contient %s avec le même texte', (open, text, close) => {
    expect(markup).toContain(open + text + close)
  })
})
