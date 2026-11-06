import { test, expect } from '@playwright/test'
import { gotoReady, watchErrors, waitHydrated } from './helpers'

/**
 * Accueil « L'ascension » : aucune attente avant la montre, ni pour un visiteur pressé (recruteur) ni pour un appareil limité.
 * Voir docs/ecran-accueil-corde.md.
 */
test.describe('Accueil : arrivée sur la montre', () => {
  test('la montre démarre seule, sans écran d’intro ni clic', async ({ page }) => {
    const errors = watchErrors(page)
    await gotoReady(page, '/')
    await expect(page.locator('#h1')).toBeAttached()
    await expect(page.locator('#gate, #gateSkip, canvas.intro-shatter')).toHaveCount(0)
    await expect(page.locator('html')).toHaveClass(/loop-live/, { timeout: 20_000 })
    expect(await page.evaluate(() => localStorage.getItem('asc-static'))).toBeNull()
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('le titre et le lien « Projets » ne clignotent pas à l’arrivée de la 3D', async ({ page }) => {
    await gotoReady(page, '/')
    await page.evaluate(() => {
      const w = window as unknown as { __min: number }
      w.__min = 1
      const tick = () => {
        for (const id of ['#head1', '#h1', 'header.top', '.top-link']) w.__min = Math.min(w.__min, +getComputedStyle(document.querySelector(id)!).opacity)
        requestAnimationFrame(tick)
      }
      tick()
    })
    await expect(page.locator('html')).toHaveClass(/loop-live/, { timeout: 20_000 })
    await page.waitForTimeout(1500)
    expect(await page.evaluate(() => (window as unknown as { __min: number }).__min)).toBe(1)
  })

  test('pas d’écran de chargement : on défile dès que la montre est là, sans attendre l’aiguille', async ({ page }) => {
    await gotoReady(page, '/')
    await waitHydrated(page)
    await page.mouse.move(300, 300)
    await expect(page.locator('html')).toHaveClass(/loop-live/, { timeout: 20_000 })
    await expect(page.locator('#loader, #loadSkip')).toHaveCount(0)
    // une fenêtre fermée avant le calage de l'aiguille ne doit pas laisser le défilement bloqué
    await page.evaluate(() => { document.getElementById('openSet')?.click(); (document.getElementById('setDlg') as HTMLDialogElement | null)?.close() })
    await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe('')
    await expect.poll(async () => { await page.mouse.wheel(0, 200); return page.evaluate(() => scrollY) }, { timeout: 5000 }).toBeGreaterThan(0)
    await expect(page.locator('#live')).toContainText('Boussole calée sur le nord')
  })

  test('économiseur de données ou 2G : vue statique d’office, sans choix à faire', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '2g' }, configurable: true })
    })
    await gotoReady(page, '/')
    await expect(page.locator('body')).toHaveClass(/static/, { timeout: 20_000 })
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
