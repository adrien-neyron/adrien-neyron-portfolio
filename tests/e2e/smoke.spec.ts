import { test, expect } from '@playwright/test'
import { watchErrors, gotoReady } from './helpers'

/** Chaque page publique répond, a un titre, un h1 unique, la langue, et ne produit aucune erreur JS. */
const PAGES: { path: string; title: RegExp }[] = [
  { path: '/', title: /Adri|Neyron/i },
  { path: '/about', title: /Randonneur/ },
  { path: '/projects', title: /Sentiers|Projets/i },
  { path: '/carnet', title: /Carnet/i },
  { path: '/ai-tools', title: /Équipement IA/ },
  { path: '/contact', title: /Bivouac/ },
  { path: '/camp-de-base', title: /Camp de Base/ },
  { path: '/outils/allure-denivele', title: /Calculateur d'allure/ },
]

for (const { path, title } of PAGES) {
  test(`${path} : rendu, titre, h1, pas d'erreur`, async ({ page }) => {
    const errors = watchErrors(page)
    await gotoReady(page, path)
    await expect(page).toHaveTitle(title)
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toBeVisible()
    await page.waitForTimeout(1200) // laisse l'hydratation et les premiers appels API se terminer
    expect(errors, errors.join('\n')).toEqual([])
  })
}

test('une URL inconnue renvoie une page d’erreur 404 lisible', async ({ page }) => {
  const res = await page.goto('/cette-page-n-existe-pas')
  expect(res?.status()).toBe(404)
  await expect(page.locator('body')).toContainText(/404|introuvable|not found/i)
})

test('fiche carnet inconnue : pas de plantage serveur', async ({ page }) => {
  const res = await page.goto('/carnet/article-inexistant')
  expect(res?.status()).toBeLessThan(500)
})

test('le fichier de la 3D et les polices sont servis', async ({ request }) => {
  for (const p of ['/fonts/inter-latin-variable.woff2', '/fonts/jetbrains-mono-latin-variable.woff2', '/models/trail-shoe.glb']) {
    expect((await request.get(p)).status(), p).toBe(200)
  }
})
