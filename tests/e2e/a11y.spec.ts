import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import { gotoReady } from './helpers'

/**
 * Accessibilité automatisée (WCAG 2.1 A/AA, base du RGAA) sur chaque page publique, en mode clair ET sombre.
 * axe ne détecte qu'une partie des critères : cela complète l'audit manuel, ne le remplace pas.
 *
 * Politique :
 *  - toute règle axe autre que `color-contrast` doit être à 0 violation (bloquant) ;
 *  - `color-contrast` suit un « cliquet » (a11y-baseline.json) : dette connue, qui ne peut que diminuer.
 */
const PAGES = ['/', '/about', '/projects', '/carnet', '/ai-tools', '/contact', '/outils/allure-denivele', '/projects/dgfip-outil-metier']
const baseline = JSON.parse(readFileSync(new URL('./a11y-baseline.json', import.meta.url), 'utf8')) as Record<string, Record<string, number>>

/** Stabilise la page avant mesure : données chargées, apparitions au scroll déclenchées, fondus JS (v-motion) terminés. */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.evaluate(async () => {
    const h = document.body.scrollHeight
    for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) }
    window.scrollTo(0, 0)
  })
  // fondus d'entrée (v-motion) : on attend que plus aucun élément ne soit à mi-opacité, même sur une machine chargée
  await page.waitForFunction(
    () => ![...document.querySelectorAll<HTMLElement>('[style*="opacity"]')].some((el) => { const o = Number(getComputedStyle(el).opacity); return o > 0.01 && o < 0.99 }),
    undefined,
    { timeout: 10_000 },
  ).catch(() => {})
  await page.waitForTimeout(1500)
}

const fmt = (violations: any[]) =>
  violations
    .map((v) => `${v.id} (${v.impact}) — ${v.help}\n` + v.nodes.slice(0, 5).map((n: any) => `   ${n.target.join(' ')}\n     ${(n.any[0]?.message ?? n.failureSummary ?? '').split('\n')[0]}`).join('\n'))
    .join('\n')

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe — thème ${scheme}`, () => {
    // animations coupées : axe mesure alors les couleurs finales, pas un fondu d'entrée à mi-opacité
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' })
    for (const path of PAGES) {
      test(path, async ({ page }) => {
        await gotoReady(page, path)
        await settle(page)
        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()

        const others = violations.filter((v) => v.id !== 'color-contrast')
        expect(others.length, `\nViolations d'accessibilité :\n${fmt(others)}\n`).toBe(0)

        const contrast = violations.find((v) => v.id === 'color-contrast')
        const count = contrast?.nodes.length ?? 0
        const allowed = baseline[scheme]?.[path] ?? 0
        expect(count, `\nContraste : ${count} éléments (max autorisé ${allowed}).\n${fmt(contrast ? [contrast] : [])}\n`).toBeLessThanOrEqual(allowed)
        if (count < allowed) {
          console.warn(`[a11y] ${scheme} ${path} : ${count} < ${allowed} — abaisser a11y-baseline.json`)
        }
      })
    }
  })
}
