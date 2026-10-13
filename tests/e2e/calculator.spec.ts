import { test, expect } from '@playwright/test'
import { gotoReady, waitHydrated } from './helpers'

test.describe('Calculateur d’allure trail', () => {
  test.beforeEach(async ({ page }) => { await gotoReady(page, '/outils/allure-denivele'); await waitHydrated(page) })

  test('affiche une estimation pour les valeurs par défaut (20 km, +800 m, 6\'00/km)', async ({ page }) => {
    await expect(page.getByText('3 h 20').first()).toBeVisible()
  })

  test('met à jour le résultat quand on change distance et dénivelé', async ({ page }) => {
    await page.getByLabel('Distance (km)').fill('10.5')
    await page.getByLabel('D+ (m)').fill('0')
    await page.getByLabel(/^D- \(m\)/).fill('0')
    // 10,5 km × 6 min = 63 min = 1 h 03
    await expect(page.getByText('1 h 03').first()).toBeVisible()
  })

  test('une saisie vide affiche le message d’aide plutôt qu’un NaN', async ({ page }) => {
    await page.getByLabel('Distance (km)').fill('')
    await expect(page.getByText(/Renseigne une distance/)).toBeVisible()
    await expect(page.locator('body')).not.toContainText('NaN')
  })

  test('le choix du terrain est utilisable au clavier', async ({ page }) => {
    const technique = page.getByRole('button', { name: /Technique/ })
    await expect(technique).toHaveAttribute('aria-pressed', 'false')
    await technique.focus()
    await page.keyboard.press('Enter')
    await expect(technique).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: /Modéré/ })).toHaveAttribute('aria-pressed', 'false')
  })
})
