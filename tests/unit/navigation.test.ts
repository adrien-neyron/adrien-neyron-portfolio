import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { NAV_STEPS, NAV_LINKS } from '~/data/navigation'

describe('navigation unique', () => {
  it('5 étapes, métaphore + libellé, pas de page en double', () => {
    expect(NAV_STEPS).toHaveLength(5)
    NAV_STEPS.forEach((s) => { expect(s.metaphor).toBeTruthy(); expect(s.label).toBeTruthy(); expect(s.links.length).toBeGreaterThan(0) })
    const paths = NAV_LINKS.map((l) => l.path)
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths).toEqual(['/', '/ai-tools', '/projects', '/about', '/carnet', '/contact'])
  })

  it('le menu « Étapes » de l’accueil (loop.html) porte les mêmes métaphores et libellés, dans le même ordre', () => {
    const html = readFileSync(new URL('../../assets/loop/loop.html', import.meta.url), 'utf8')
    const menu = html.slice(html.indexOf('id="railNav"'))
    const items = [...menu.matchAll(/<span class="m">([^<]+)<\/span><span class="l">([^<]+)<\/span>/g)].slice(0, 5).map((m) => [m[1], m[2]])
    expect(items).toEqual(NAV_STEPS.map((s) => [s.metaphor, s.label]))
  })
})
