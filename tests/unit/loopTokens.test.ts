import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
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
    expect(Object.keys(dark).length).toBeGreaterThan(20)
    expect(Object.keys(light).length).toBeGreaterThan(20)
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

  it('anneau de focus visible (≥ 3:1) sur le fond, jour et nuit', () => {
    for (const theme of [light, dark]) expect(ratio(theme['--focus'], theme['--bg'])).toBeGreaterThanOrEqual(3)
  })

  it('loop.css est bien la compilation de loop.source.css (relancer scripts/scope-loop-css.cjs sinon)', () => {
    const tmp = join(tmpdir(), `loop-${process.pid}.css`)
    execFileSync('node', ['scripts/scope-loop-css.cjs', 'assets/loop/loop.source.css', tmp], { stdio: 'pipe' })
    expect(readFileSync(tmp, 'utf8') === readFileSync('assets/loop/loop.css', 'utf8')).toBe(true)
  })
})
