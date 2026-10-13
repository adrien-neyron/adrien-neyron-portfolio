import { test, expect } from '@playwright/test'

test.describe('API publique sans base de données', () => {
  test('/api/loop-content répond toujours un objet JSON (jamais une 500) et n’est pas mis en cache', async ({ request }) => {
    const res = await request.get('/api/loop-content')
    expect(res.status()).toBe(200)
    expect(typeof (await res.json())).toBe('object')
    expect(res.headers()['cache-control']).toContain('no-store')
  })
})

test.describe('API admin : refuse tout accès non authentifié', () => {
  const WRITES: [string, string][] = [
    ['PUT', '/api/admin/profile'],
    ['POST', '/api/admin/projects'],
    ['PUT', '/api/admin/projects/abc'],
    ['DELETE', '/api/admin/projects/abc'],
    ['POST', '/api/admin/projects/covers'],
    ['POST', '/api/admin/projects/cover-suggestions'],
    ['POST', '/api/admin/ai-tools'],
    ['DELETE', '/api/admin/ai-tools/abc'],
    ['POST', '/api/admin/carnet'],
    ['DELETE', '/api/admin/carnet/abc'],
    ['POST', '/api/admin/carnet/generate'],
    ['POST', '/api/admin/upload'],
    ['POST', '/api/admin/seed'],
  ]
  for (const [method, url] of WRITES) {
    test(`${method} ${url} → 401 sans jeton`, async ({ request }) => {
      const res = await request.fetch(url, { method, data: {}, headers: { 'content-type': 'application/json' } })
      expect(res.status()).toBe(401)
    })
    test(`${method} ${url} → 401 avec un faux jeton`, async ({ request }) => {
      const res = await request.fetch(url, { method, data: {}, headers: { authorization: 'Bearer faux.jeton.invalide', 'content-type': 'application/json' } })
      expect(res.status()).toBe(401)
    })
  }

  test('GET /api/admin/projects exige aussi un jeton', async ({ request }) => {
    expect((await request.get('/api/admin/projects')).status()).toBe(401)
  })

  test('la route publique d’écriture sur les projets n’existe plus', async ({ request }) => {
    const res = await request.post('/api/projects', { data: { title: 'intrus' } })
    expect([404, 405]).toContain(res.status())
  })
})
