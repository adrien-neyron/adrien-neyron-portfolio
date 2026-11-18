import { test, expect } from '@playwright/test'
import { gotoReady, waitHydrated } from './helpers'

/** WAYFINDER : viseur de navigation clavier (utils/wayfinder.ts, docs/wayfinder.md). */
/** Page prête et WAYFINDER posé (plugin client, après l'hydratation). */
async function open(page: import('@playwright/test').Page, path: string) {
  await gotoReady(page, path)
  await waitHydrated(page)
  await expect(page.locator('#wayfinder')).toHaveCount(1)
}

const state = (page: import('@playwright/test').Page) => page.evaluate(() => {
  const a = document.activeElement as HTMLElement, r = a.getBoundingClientRect()
  const v = document.querySelector('.wf-v') as HTMLElement | null, vr = v?.getBoundingClientRect()
  return {
    kb: document.documentElement.classList.contains('wf-kb'),
    on: !!v?.classList.contains('on'),
    gap: vr ? Math.round(Math.abs(vr.left - (r.left - 6)) + Math.abs(vr.top - (r.top - 6))) : -1,
    label: document.querySelector('.wf-l')?.textContent ?? '',
    hidden: document.getElementById('wayfinder')?.getAttribute('aria-hidden'),
    nativeOutline: getComputedStyle(a).outlineStyle,
  }
})

test.describe('WAYFINDER', () => {
  test('Tab : le viseur entoure l’élément qui a vraiment le focus, avec son nom ; le focus natif reste', async ({ page }) => {
    await open(page, '/projects')
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab')
    await expect.poll(async () => (await state(page)).on).toBe(true)
    await page.waitForTimeout(300)   // fin du glissement
    const s = await state(page)
    expect(s.kb).toBe(true)
    expect(s.gap).toBeLessThanOrEqual(2)
    expect(s.label.length).toBeGreaterThan(0)
    expect(s.hidden).toBe('true')
    expect(s.nativeOutline).not.toBe('none')
  })

  test('souris seule : jamais de viseur ; un clic éteint le mode clavier', async ({ page }) => {
    await open(page, '/projects')
    await page.mouse.click(5, 400)
    expect((await state(page)).kb).toBe(false)
    await page.keyboard.press('Tab')
    await expect.poll(async () => (await state(page)).kb).toBe(true)
    await page.mouse.click(5, 400)
    const s = await state(page)
    expect(s.kb).toBe(false)
    expect(s.on).toBe(false)
  })

  test('mouvement réduit : pas de trace', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/projects')
    for (let i = 0; i < 3; i++) await page.keyboard.press('Tab')
    await expect.poll(async () => (await state(page)).on).toBe(true)
    expect(await page.locator('.wf-trail').evaluate((e) => getComputedStyle(e).display)).toBe('none')
  })

  test('aucun tabindex positif sur les pages', async ({ page }) => {
    for (const path of ['/projects', '/about', '/contact']) {
      await gotoReady(page, path)
      expect(await page.locator('[tabindex]').evaluateAll((els) => els.filter((e) => Number(e.getAttribute('tabindex')) > 0).length)).toBe(0)
    }
  })
})
