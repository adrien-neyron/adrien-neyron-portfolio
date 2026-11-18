import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Jetons de couleur de l'accueil (assets/loop/loop.source.css) : symétrie jour/nuit (mêmes clés des deux côtés)
 * et contrastes WCAG AA / RGAA 3.2 sur les paires texte/fond qui comptent. Le CSS compilé (loop.css) doit
 * rester synchronisé avec la source (scripts/scope-loop-css.cjs).
 */
const css = readFileSync(new URL('../../assets/loop/loop.source.css', import.meta.url), 'utf8')

/** Toutes les déclarations `--x:valeur` d'un bloc dont le sélecteur correspond. */
function block(selector: RegExp): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selector.test(m[1].trim())) continue
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)) out[d[1]] = d[2].trim()
  }
  return out
}

const dark  = { ...block(/^:root:not\(\[data-theme="light"\]\)$/), ...block(/^:root\[data-theme="dark"\]$/), ...block(/^:root,:root\[data-theme="dark"\]$/) }
const light = { ...block(/^:root$/), ...block(/^:root\[data-theme="light"\]$/) }

const lum = (hex: string) => {
  const n = hex.replace('#', ''); const v = n.length === 3 ? n.split('').map((c) => c + c).join('') : n
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

describe('jetons jour / nuit', () => {
  it('on a bien trouvé les deux palettes', () => {
    expect(Object.keys(dark).length).toBeGreaterThan(15)
    expect(Object.keys(light).length).toBeGreaterThan(15)
  })

  it('symétrie : chaque jeton existe en jour ET en nuit', () => {
    const colorTokens = (t: Record<string, string>) => Object.keys(t).filter((k) => k !== '--hh') // --hh = hauteur d'en-tête, pas une couleur
    const missingInLight = colorTokens(dark).filter((k) => !(k in light))
    const missingInDark = colorTokens(light).filter((k) => !(k in dark))
    expect(missingInLight, 'absents du thème clair').toEqual([])
    expect(missingInDark, 'absents du thème sombre').toEqual([])
  })

  it.each([
    ['--fg', '--bg', 4.5],
    ['--muted', '--bg', 4.5],
    ['--acc-text', '--bg', 4.5],
    ['--fg', '--card', 4.5],
    ['--muted', '--card', 4.5],
    ['--brand', '--bg', 4.5],
  ])('contraste AA %s sur %s ≥ %s (jour et nuit)', (fg, bg, min) => {
    for (const [name, theme] of [['jour', light], ['nuit', dark]] as const) {
      expect(theme[fg], `${fg} ${name}`).toMatch(/^#/); expect(theme[bg], `${bg} ${name}`).toMatch(/^#/)
      expect(ratio(theme[fg], theme[bg]), `${fg}/${bg} ${name}`).toBeGreaterThanOrEqual(min)
    }
  })

  it('bouton « Lancer la visite guidée » (fantôme) : contour ≥ 3:1 et texte ≥ 4,5:1 sur le fond, jour et nuit', () => {
    for (const theme of [light, dark]) {
      expect(ratio(theme['--cta-line'], theme['--bg'])).toBeGreaterThanOrEqual(3)
      expect(ratio(theme['--fg'], theme['--bg'])).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('infobulle HUD du cadran : texte ≥ 4,5:1 dans le pire cas (fond blanc assombri par le backdrop-filter, voile pierre à --hud-a)', () => {
    const css2 = css.replace(/\s+/g, '')
    const bright = Number(/\.tip\{[^}]*brightness\(([\d.]+)\)/.exec(css2)?.[1])
    expect(bright).toBeGreaterThan(0)
    for (const theme of [light, dark]) {
      const a = Number(theme['--hud-a']), rgb = theme['--hud-bg'].split(',').map(Number)
      const hex = '#' + rgb.map((c) => Math.round(a * c + (1 - a) * 255 * bright).toString(16).padStart(2, '0')).join('')
      for (const k of ['--hud-fg', '--hud-muted', '--hud-badge']) expect(ratio(theme[k], hex), k).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('WAYFINDER : orange de repérage --wpt ≥ 3:1 sur le fond, jour et nuit (viseur, trace, rail)', () => {
    for (const theme of [light, dark]) expect(ratio(theme['--wpt'], theme['--bg'])).toBeGreaterThanOrEqual(3)
    expect(css).toMatch(/html\{--wf-c:var\(--wpt\);--wf-halo:var\(--bg\);--wf-bg:var\(--card\);--wf-fg:var\(--fg\)\}/)
  })

  it('fiche d’étape de jour (papier) : texte ≥ 4,5:1, bouton ≥ 4,5:1', () => {
    const blk = /:root\[data-theme="light"\]\{(--exp-glass[^}]+)\}/.exec(css)?.[1] ?? ''
    const t: Record<string, string> = Object.fromEntries([...blk.matchAll(/(--exp-[\w-]+):([^;]+)/g)].map((m) => [m[1], m[2].trim()]))
    expect(t['--exp-glass']).toMatch(/rgba\(252,247,238,\.9\d\)/)
    const paper = '#FCF7EE'
    for (const k of ['--exp-ink', '--exp-muted', '--exp-meta', '--exp-cta']) expect(ratio(t[k], paper), k).toBeGreaterThanOrEqual(4.5)
    expect(ratio(t['--exp-cta-ink'], t['--exp-cta'])).toBeGreaterThanOrEqual(4.5)
  })

  it('anneau de focus visible (≥ 3:1) sur le fond, jour et nuit', () => {
    for (const theme of [light, dark]) expect(ratio(theme['--focus'], theme['--bg'])).toBeGreaterThanOrEqual(3)
  })

  it('fond photographique du hero : images présentes (jour, nuit, mobile) et surtitre ≥ 4,5:1 sur le voile', () => {
    for (const [name, theme] of [['jour', light], ['nuit', dark]] as const) {
      for (const k of ['--hero-photo', '--hero-photo-m']) {
        const file = /url\(([^)]+)\)/.exec(theme[k])?.[1]
        expect(file, `${k} ${name}`).toBeTruthy()
        expect(existsSync(new URL(`../../public${file}`, import.meta.url)), `${file} manquant`).toBe(true)
      }
      // pire cas : le voile à 100 % de --hero-scrim (la photo n'éclaircit pas plus que le voile plein côté clair, ni ne l'assombrit côté sombre)
      const [r, g, b] = theme['--hero-scrim'].split(',').map((n) => Number(n).toString(16).padStart(2, '0'))
      expect(ratio(theme['--hero-eyebrow'], `#${r}${g}${b}`), `surtitre ${name}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('loop.css est bien la compilation de loop.source.css (relancer scripts/scope-loop-css.cjs sinon)', () => {
    const tmp = join(tmpdir(), `loop-${process.pid}.css`)
    execFileSync('node', ['scripts/scope-loop-css.cjs', 'assets/loop/loop.source.css', tmp], { stdio: 'pipe' })
    expect(readFileSync(tmp, 'utf8') === readFileSync('assets/loop/loop.css', 'utf8')).toBe(true)
  })
})
