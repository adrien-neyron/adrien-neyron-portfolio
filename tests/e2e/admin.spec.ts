import { test, expect } from '@playwright/test'

// /admin est consultable par tous en lecture seule : seul ADMIN_EMAIL peut modifier
// (l'écriture est de toute façon refusée côté serveur, cf. api.spec.ts).
test.describe('Admin : visite en lecture seule', () => {
  for (const path of ['/admin', '/admin/profile', '/admin/carnet', '/admin/ai-tools']) {
    test(`${path} sans session s'affiche en lecture seule`, async ({ page }) => {
      await page.goto(path)
      // pas de networkidle : sans base en e2e, les listes finissent en erreur après plusieurs secondes
      await expect(page.getByText('Visite en lecture seule.')).toBeVisible()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      await expect(page.getByRole('button', { name: /Enregistrer|Importer|Supprimer/ })).toHaveCount(0)
      await expect(page.getByRole('link', { name: /Nouve(au|l|lle)/ })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Connexion admin' })).toBeVisible()
    })
  }

  for (const [path, list] of [['/admin/projects/new', '/admin'], ['/admin/carnet/new', '/admin/carnet'], ['/admin/ai-tools/new', '/admin/ai-tools']]) {
    test(`${path} renvoie un visiteur vers la liste`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(new RegExp(`${list}$`))
    })
  }

  test('le profil se lit mais aucun champ ne se modifie', async ({ page }) => {
    await page.goto('/admin/profile')
    await page.waitForLoadState('networkidle')
    const fields = page.locator('form :is(input, textarea, select)')
    expect(await fields.count()).toBeGreaterThan(0)
    for (const field of await fields.all()) await expect(field).toBeDisabled()
  })

  test('le rôle renvoyé sans jeton est « lecteur »', async ({ request }) => {
    const res = await request.get('/api/auth/role')
    expect(await res.json()).toEqual({ role: 'lecteur' })
  })

  test('la page de connexion a un titre, un h1 et un bouton accessible', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('button').first()).toBeVisible()
  })
})
