import { test, expect } from '@playwright/test'
import { gotoReady, waitHydrated } from './helpers'

/**
 * Trace en étapes (docs/admin-boucle.md, « Étapes ») : sans 3D ni animation, toutes les étapes restent lisibles,
 * dans l'ordre, avec dates et vrais liens vers les fiches. Sans base, les étapes par défaut (data/stages.ts) s'affichent.
 */
test('accueil : lien « Projets » visible dès le premier écran, avant la 3D', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('cordee-gate-vu', '1'))
  await gotoReady(page, '/')
  const link = page.locator('header.top a.top-link')
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', '/projects')
  expect(await page.evaluate(() => document.documentElement.classList.contains('loop-live'))).toBe(false)
})

test('accueil en mouvement réduit : toutes les étapes, dans l’ordre, avec dates et liens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await gotoReady(page, '/')
  await waitHydrated(page)
  await page.getByRole('button', { name: /Passer l.intro/ }).click()
  await expect(page.locator('body')).toHaveClass(/static/, { timeout: 30_000 })
  const list = page.locator('#pList')
  await expect(list).toBeVisible()
  const heads = await list.locator(':scope > li > p.e').allTextContents()
  expect(heads[0]).toMatch(/^Départ · /)
  expect(heads.at(-1)).toMatch(/^Cairn final/)
  expect(heads.map((h) => h.split(' · ')[0])).toEqual(['Départ', 'Étape 01', 'Étape 02', 'Bivouac', 'Étape 03', 'Cairn final'])
  await expect(list.getByRole('link', { name: /Écrire la suite/ })).toHaveAttribute('href', '/contact')
  for (const href of await list.locator('a[href^="/projects/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
    expect((await page.request.get(href!)).status(), href!).toBeLessThan(400)   // aucun lien mort
  }
})

test('/projects : filtre Missions / Projets perso et bandeau de chiffres', async ({ page }) => {
  await gotoReady(page, '/projects')
  await waitHydrated(page)
  await expect(page.locator('dl.trail-stats dd').first()).toBeVisible()
  const count = page.locator('[aria-live="polite"]').filter({ hasText: /sentier/ })
  await page.getByRole('button', { name: 'Projets perso' }).click()
  await expect(page.getByRole('button', { name: 'Projets perso' })).toHaveAttribute('aria-pressed', 'true')
  await expect(count).toContainText('Projets perso')
  await page.getByRole('button', { name: 'Missions' }).click()
  await expect(count).toContainText('Missions')
})
