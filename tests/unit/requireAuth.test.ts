import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeEvent, runtimeConfig } from './setup'

const jwtVerify = vi.fn()
vi.mock('jose', () => ({ createRemoteJWKSet: vi.fn(() => 'jwks'), jwtVerify: (...a: unknown[]) => jwtVerify(...a) }))

import { requireAuth, requireAdminWrite, isAdminRequest } from '~/server/utils/requireAuth'

const bearer = (t = 'tok') => makeEvent({ Authorization: `Bearer ${t}` }) as any

beforeEach(() => {
  jwtVerify.mockReset()
  runtimeConfig.adminEmail = 'admin@example.com'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('requireAuth', () => {
  it("refuse sans en-tête Authorization (401)", async () => {
    await expect(requireAuth(makeEvent() as any)).rejects.toMatchObject({ statusCode: 401 })
  })
  it('refuse un schéma autre que Bearer (401)', async () => {
    await expect(requireAuth(makeEvent({ Authorization: 'Basic abc' }) as any)).rejects.toMatchObject({ statusCode: 401 })
  })
  it('refuse un jeton invalide (401)', async () => {
    jwtVerify.mockRejectedValue(new Error('bad'))
    await expect(requireAuth(bearer())).rejects.toMatchObject({ statusCode: 401 })
  })
  it('vérifie émetteur et audience Auth0 depuis la config', async () => {
    jwtVerify.mockResolvedValue({ payload: { email: 'a@b.c' } })
    await requireAuth(bearer('xyz'))
    expect(jwtVerify).toHaveBeenCalledWith('xyz', 'jwks', {
      issuer: 'https://example.eu.auth0.com/',
      audience: 'client-id',
    })
  })
})

describe('requireAdminWrite', () => {
  it("laisse passer l'e-mail administrateur", async () => {
    jwtVerify.mockResolvedValue({ payload: { email: 'admin@example.com' } })
    await expect(requireAdminWrite(bearer())).resolves.toBeUndefined()
  })
  it('refuse un autre compte authentifié (403)', async () => {
    jwtVerify.mockResolvedValue({ payload: { email: 'intrus@example.com' } })
    await expect(requireAdminWrite(bearer())).rejects.toMatchObject({ statusCode: 403 })
  })
  it('refuse tout le monde si ADMIN_EMAIL est vide (403, jamais « ouvert »)', async () => {
    runtimeConfig.adminEmail = ''
    jwtVerify.mockResolvedValue({ payload: { email: undefined } })
    await expect(requireAdminWrite(bearer())).rejects.toMatchObject({ statusCode: 403 })
  })
  it('la comparaison est exacte (casse comprise)', async () => {
    jwtVerify.mockResolvedValue({ payload: { email: 'Admin@example.com' } })
    await expect(requireAdminWrite(bearer())).rejects.toMatchObject({ statusCode: 403 })
  })
})

describe('isAdminRequest (rôle affiché dans /admin)', () => {
  it('visiteur sans jeton : false, sans vérifier de JWT', async () => {
    await expect(isAdminRequest(makeEvent() as any)).resolves.toBe(false)
    expect(jwtVerify).not.toHaveBeenCalled()
  })
  it('jeton invalide : false (ne lève jamais)', async () => {
    jwtVerify.mockRejectedValue(new Error('bad'))
    await expect(isAdminRequest(bearer())).resolves.toBe(false)
  })
  it('autre compte connecté : false', async () => {
    jwtVerify.mockResolvedValue({ payload: { email: 'intrus@example.com' } })
    await expect(isAdminRequest(bearer())).resolves.toBe(false)
  })
  it("e-mail administrateur : true", async () => {
    jwtVerify.mockResolvedValue({ payload: { email: 'admin@example.com' } })
    await expect(isAdminRequest(bearer())).resolves.toBe(true)
  })
  it('ADMIN_EMAIL vide : false pour tout le monde', async () => {
    runtimeConfig.adminEmail = ''
    jwtVerify.mockResolvedValue({ payload: { email: '' } })
    await expect(isAdminRequest(bearer())).resolves.toBe(false)
  })
})
