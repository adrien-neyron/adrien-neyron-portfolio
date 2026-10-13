/**
 * Simule les auto-imports Nuxt / Nitro utilisés par le code serveur et les composables, pour les exécuter
 * sous Vitest sans démarrer Nuxt. Les erreurs sont de vraies erreurs h3 (createError), donc statusCode vérifiable.
 */
import { vi } from 'vitest'
import { createError } from 'h3'
import { ref, computed, reactive, watch, onMounted } from 'vue'

export const runtimeConfig: Record<string, any> = {
  adminEmail: 'admin@example.com',
  unsplashAccessKey: '',
  geminiApiKey: '',
  public: { auth0Domain: 'example.eu.auth0.com', auth0ClientId: 'client-id' },
}

/** Faux événement : seuls les en-têtes et le corps nous intéressent. */
export interface FakeEvent { headers: Record<string, string>; body?: unknown; responseHeaders: Record<string, string> }
export const makeEvent = (headers: Record<string, string> = {}, body?: unknown): FakeEvent => ({
  headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])),
  body,
  responseHeaders: {},
})

vi.stubGlobal('defineEventHandler', (h: unknown) => h)
vi.stubGlobal('createError', createError)
vi.stubGlobal('getHeader', (e: FakeEvent, n: string) => e.headers[n.toLowerCase()])
vi.stubGlobal('setHeader', (e: FakeEvent, n: string, v: string) => { e.responseHeaders[n.toLowerCase()] = v })
vi.stubGlobal('readBody', async (e: FakeEvent) => e.body)
vi.stubGlobal('useRuntimeConfig', () => runtimeConfig)
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('reactive', reactive)
vi.stubGlobal('watch', watch)
vi.stubGlobal('onMounted', onMounted)
