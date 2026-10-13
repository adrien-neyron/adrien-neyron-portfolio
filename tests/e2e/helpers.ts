import { expect, type Page } from '@playwright/test'

/**
 * Erreurs de console tolérées : sans base de données, les appels /api/* échouent (500) et le site retombe sur ses
 * données statiques, c'est le comportement voulu. Tout le reste (exception JS, hydratation, ressource 404) fait échouer.
 */
const IGNORED = [
  /Failed to load resource: the server responded with a status of 5\d\d/,
  /\/api\//,
  /WebGL|GPU stall|swiftshader|GL Driver Message/i, // rendu logiciel du navigateur de test
  /Auth0|auth0/i,
  /net::ERR_/, // ressources de tiers (Unsplash…) injoignables : les ressources du site sont vérifiées par le statut HTTP ci-dessous
]

export function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text()
    if (!IGNORED.some((re) => re.test(t))) errors.push(`console: ${t}`)
  })
  page.on('response', (r) => {
    const u = new URL(r.url())
    if (u.hostname === '127.0.0.1' && !u.pathname.startsWith('/api/') && r.status() >= 400) errors.push(`${r.status()} ${u.pathname}`)
  })
  return errors
}

export async function gotoReady(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
  expect(res?.status(), `statut HTTP de ${path}`).toBeLessThan(400)
  await page.waitForLoadState('load')
  return res
}

/** Attend l'hydratation Vue : avant elle, saisir dans un champ du HTML rendu serveur n'a aucun effet (test instable). */
export async function waitHydrated(page: Page) {
  await page.waitForFunction(() => {
    const w = window as unknown as { useNuxtApp?: () => { isHydrating?: boolean } }
    return !!w.useNuxtApp && w.useNuxtApp().isHydrating === false
  })
}
