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

/** Vue statique : toutes les scènes dans le flux, rien de perdu ni de masqué. Voir docs/preferences-visiteur.md. */
test.describe('Accueil : vue statique', () => {
  test.use({ reducedMotion: 'reduce' })

  async function gotoStatic(page: import('@playwright/test').Page, path = '/') {
    await gotoReady(page, path)
    await expect(page.locator('body')).toHaveClass(/static/, { timeout: 20_000 })
  }

  test('le contenu reste accessible : cartes visibles, zones de la flaque retirées, pied de page dans le flux', async ({ page }) => {
    await gotoStatic(page)
    await expect(page.locator('#pAbout .route')).toBeVisible()
    await expect(page.locator('#pBlog .route')).toBeVisible()
    await expect(page.locator('#sideL')).toBeHidden() // sans libellé ni focus visible hors 3D : les boutons des cartes les remplacent
    await expect(page.locator('#sideR')).toBeHidden()
    expect(await page.locator('footer.perma').evaluate((f) => getComputedStyle(f).position)).toBe('static')
    await page.locator('#pAbout .route').click()
    await expect(page.locator('#dlgProfil')).toBeVisible()
  })

  test('l’ordre du DOM suit l’ordre affiché', async ({ page }) => {
    await gotoStatic(page)
    const before = (a: string, b: string) => page.evaluate(([x, y]) => !!(document.querySelector(x)!.compareDocumentPosition(document.querySelector(y)!) & Node.DOCUMENT_POSITION_FOLLOWING), [a, b])
    expect(await before('#tools', '#eqMore')).toBe(true) // le lien « Voir tout » vient après les cartes, à la tabulation aussi
    expect(await before('#h-map', '#pList')).toBe(true) // le titre de la scène annonce la liste
  })

  test('le menu « Étapes » déplace le focus sur le titre de la scène', async ({ page }) => {
    await gotoStatic(page)
    await page.locator('#burgerSteps').click()
    await page.locator('#railNav button[data-h="bivouac"]').click()
    await expect(page.locator('#h-biv')).toBeFocused()
    const top = await page.locator('#h-biv').evaluate((h) => h.getBoundingClientRect().top)
    expect(top).toBeGreaterThan(await page.locator('header.top').evaluate((h) => h.getBoundingClientRect().bottom)) // pas sous l'en-tête
  })

  for (const [width, height] of [[320, 568], [1280, 420]]) {
    test(`rien n’est coupé en ${width} × ${height} (zoom 400 %, faible hauteur)`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await gotoStatic(page)
      const r = await page.evaluate(() => {
        const out: string[] = []
        for (const e of document.querySelectorAll<HTMLElement>('#tools, #pList, .pcard, #bivtext, #restart')) {
          if (e.getBoundingClientRect().bottom > e.closest('.scene')!.getBoundingClientRect().bottom + 1) out.push(e.id || e.className)
        }
        return { out, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }
      })
      expect(r.out).toEqual([])
      expect(r.sw).toBeLessThanOrEqual(r.cw)
    })
  }
})
