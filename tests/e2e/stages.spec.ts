import { test, expect } from '@playwright/test'
import { gotoReady, waitHydrated } from './helpers'

/**
 * Trace en étapes (docs/admin-boucle.md, « Étapes ») : sans 3D ni animation, toutes les étapes restent lisibles,
 * dans l'ordre, avec dates et vrais liens vers les fiches. Sans base, les étapes par défaut (data/stages.ts) s'affichent.
 */
test('accueil : logo, titre et lien « Projets » visibles dès le premier écran, avant la 3D', async ({ browser }) => {
  // sans JavaScript, la 3D ne démarre jamais : c'est exactement ce qui s'affiche avant elle, quelle que soit la vitesse de la machine
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.locator('#brand')).toBeVisible()
  await expect(page.locator('#h1')).toBeVisible()
  const link = page.locator('header.top a.top-link')
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', '/projects')
  await context.close()
})

test('accueil en mouvement réduit : toutes les étapes, dans l’ordre, avec dates et liens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await gotoReady(page, '/')
  await waitHydrated(page)
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
  const count = page.locator('[aria-live="polite"]').filter({ hasText: /projet/ })
  await page.getByRole('button', { name: 'Projets perso' }).click()
  await expect(page.getByRole('button', { name: 'Projets perso' })).toHaveAttribute('aria-pressed', 'true')
  await expect(count).toContainText('Projets perso')
  await page.getByRole('button', { name: 'Missions' }).click()
  await expect(count).toContainText('Missions')
})
