import { test, expect } from '@playwright/test'
import { gotoReady, watchErrors, waitHydrated } from './helpers'

/**
 * Accueil « L'ascension » : l'intro 3D ne doit jamais bloquer un visiteur pressé (recruteur) ni un appareil limité.
 * Voir docs/ecran-accueil-corde.md.
 */
test.describe('Accueil : écran d’accueil et intro 3D', () => {
  test('le bouton « Passer l’intro » ferme l’écran tout de suite et mémorise la vue statique', async ({ page }) => {
    const errors = watchErrors(page)
    await gotoReady(page, '/')
    await waitHydrated(page)
    const gate = page.locator('#gate')
    await expect(gate).toBeVisible()
    const skip = page.getByRole('button', { name: /Passer l.intro/ })
    await expect(skip).toBeVisible()
    await skip.focus()
    await page.keyboard.press('Enter') // utilisable au clavier
    await expect(gate).toBeHidden({ timeout: 2000 }) // sans attendre la 3D ni l'animation de 1,1 s
    expect(await page.evaluate(() => localStorage.getItem('asc-static'))).toBe('1')
    // la vue statique s'applique dès que la boucle est prête
    await expect(page.locator('body')).toHaveClass(/static/, { timeout: 20_000 })
    await expect(page.locator('#loader')).toBeHidden()
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('sans aucun clic, l’écran s’ouvre seul et l’écran se ferme', async ({ page }) => {
    test.setTimeout(150_000)
    const errors = watchErrors(page)
    await gotoReady(page, '/')
    await waitHydrated(page)
    await expect(page.locator('#gate')).toBeVisible()
    await expect(page.locator('#gate')).toBeHidden({ timeout: 20_000 }) // 4,5 s + animation au plus, même sans carte graphique
    expect(await page.evaluate(() => localStorage.getItem('asc-static'))).toBeNull() // l'intro normale reste active
    // l'écran DOM disparaît dès que l'image identique est affichée ; la fin de l'animation (éclats) vient ensuite
    await expect(page.locator('canvas.intro-shatter')).toHaveCount(0, { timeout: 60_000 })
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('cordee-gate-vu')), { timeout: 10_000 }).toBe('1')
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('un clic sur l’écran reste un accélérateur', async ({ page }) => {
    await gotoReady(page, '/')
    await waitHydrated(page)
    await page.locator('#gate').click({ position: { x: 40, y: 40 } })
    await expect(page.locator('#gate')).toBeHidden({ timeout: 20_000 })
    expect(await page.evaluate(() => localStorage.getItem('asc-static'))).toBeNull()
  })

  test('économiseur de données ou 2G : vue statique d’office, sans choix à faire', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '2g' }, configurable: true })
    })
    await gotoReady(page, '/')
    await waitHydrated(page)
    await page.getByRole('button', { name: /Passer l.intro/ }).click()
    await expect(page.locator('body')).toHaveClass(/static/, { timeout: 20_000 })
  })

  test('l’écran se brise en éclats (canvas WebGL) puis le canvas est retiré du DOM', async ({ page }) => {
    test.setTimeout(150_000)
    const errors = watchErrors(page)
    await gotoReady(page, '/')
    await waitHydrated(page)
    await page.locator('#gate').click({ position: { x: 40, y: 40 } })
    // le canvas existe pendant la transition (aria-hidden : l'écran DOM reste la version accessible)…
    await page.waitForSelector('canvas.intro-shatter', { state: 'attached', timeout: 20_000 }).catch(() => {})
    await expect(page.locator('#gate')).toBeHidden({ timeout: 30_000 })
    // …et libéré à la fin
    await expect(page.locator('canvas.intro-shatter')).toHaveCount(0, { timeout: 60_000 })
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('prefers-reduced-motion : pas d’éclats, simple fondu', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoReady(page, '/')
    await waitHydrated(page)
    await page.locator('#gate').click({ position: { x: 40, y: 40 } })
    await expect(page.locator('canvas.intro-shatter')).toHaveCount(0)
    await expect(page.locator('#gate')).toBeHidden({ timeout: 20_000 })
  })
})
