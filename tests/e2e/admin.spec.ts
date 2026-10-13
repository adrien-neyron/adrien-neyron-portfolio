import { test, expect } from '@playwright/test'

test.describe('Admin : zone protégée', () => {
  for (const path of ['/admin', '/admin/projects/new', '/admin/profile', '/admin/carnet', '/admin/ai-tools']) {
    test(`${path} sans session ne montre pas le back-office`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // soit redirection vers la connexion, soit page de login : jamais le formulaire d'édition
      await expect(page).toHaveURL(/\/admin\/login|auth0\.com|\/$/)
      await expect(page.getByLabel(/Titre de l'accueil/)).toHaveCount(0)
    })
  }

  test('la page de connexion a un titre, un h1 et un bouton accessible', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('button').first()).toBeVisible()
  })
})
