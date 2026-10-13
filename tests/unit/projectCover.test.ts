import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runtimeConfig } from './setup'

const generateContent = vi.fn()
vi.mock('@google/genai', () => ({ GoogleGenAI: class { models = { generateContent } } }))

import { coverSourceFromForm, isUnsplashConfigured, buildCoverQuery, findCoverFor, searchUnsplash } from '~/server/utils/projectCover'

const $fetch = vi.fn()
beforeEach(() => {
  runtimeConfig.unsplashAccessKey = ''
  runtimeConfig.geminiApiKey = ''
  $fetch.mockReset(); generateContent.mockReset()
  vi.stubGlobal('$fetch', $fetch)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('coverSourceFromForm', () => {
  it('vide → aucune source', () => expect(coverSourceFromForm({})).toBeUndefined())
  it('photo choisie parmi les suggestions → unsplash', () => expect(coverSourceFromForm({ cover: 'u', coverSource: 'unsplash' })).toBe('unsplash'))
  it('photo saisie ou uploadée → admin', () => {
    expect(coverSourceFromForm({ cover: 'u' })).toBe('admin')
    expect(coverSourceFromForm({ cover: 'u', coverSource: 'autre' })).toBe('admin')
  })
})

describe('buildCoverQuery', () => {
  it('priorité aux mots-clés saisis dans l’admin', async () => {
    expect(await buildCoverQuery({ coverQuery: '  garage tyres ' })).toBe('garage tyres')
  })
  it('sans Gemini, retombe sur la table par catégorie (toujours une chaîne)', async () => {
    expect((await buildCoverQuery({ category: 'IA' })).length).toBeGreaterThan(0)
    expect((await buildCoverQuery({})).length).toBeGreaterThan(0)
  })
  it('Gemini : garde 4 mots anglais maximum, sans ponctuation', async () => {
    runtimeConfig.geminiApiKey = 'k'
    generateContent.mockResolvedValue({ text: 'tyre, garage workshop mechanic extra word!' })
    expect(await buildCoverQuery({ title: 't', description: 'd' })).toBe('tyre garage workshop mechanic')
  })
  it('Gemini en erreur → repli catégorie, sans lever', async () => {
    runtimeConfig.geminiApiKey = 'k'
    generateContent.mockRejectedValue(new Error('quota'))
    await expect(buildCoverQuery({ description: 'd', category: 'IA' })).resolves.toBeTruthy()
  })
})

describe('findCoverFor', () => {
  it('ne touche jamais à une photo existante', async () => {
    expect(await findCoverFor({ cover: 'https://x/y.jpg' }, { force: true })).toBeNull()
  })
  it('ne relance pas une recherche ratée il y a moins de 24 h', async () => {
    runtimeConfig.unsplashAccessKey = 'k'
    expect(await findCoverFor({ slug: 'zzz', coverCheckedAt: new Date() })).toBeNull()
    expect($fetch).not.toHaveBeenCalled()
  })
  it('sans clé Unsplash ni photo par défaut : rien à faire', async () => {
    expect(await findCoverFor({ slug: 'inconnu-xyz' })).toBeNull()
  })
  it('Unsplash : enregistre photo, crédit, id et signale le téléchargement', async () => {
    runtimeConfig.unsplashAccessKey = 'k'
    $fetch.mockImplementation(async (url: string) => url.includes('/search/photos')
      ? { results: [{ id: 'ph1', urls: { raw: 'https://images.unsplash.com/ph1?ixid=1', small: 's' }, links: { html: 'https://unsplash.com/photos/ph1', download_location: 'd' }, user: { name: 'Jane', links: { html: 'h' } }, alt_description: 'alt' }] }
      : {})
    const r = await findCoverFor({ slug: 'inconnu-xyz', title: 'T', coverQuery: 'garage' })
    expect(r).toMatchObject({ coverSource: 'unsplash', coverUnsplashId: 'ph1', coverCredit: 'Jane / Unsplash', coverQuery: 'garage' })
    expect(r?.cover).toContain('w=1600&h=900')
    expect($fetch.mock.calls.some(([u]) => String(u).endsWith('/photos/ph1/download'))).toBe(true)
  })
  it("une panne Unsplash ne lève jamais (l'enregistrement d'un projet ne doit pas échouer)", async () => {
    runtimeConfig.unsplashAccessKey = 'k'
    $fetch.mockRejectedValue(new Error('429'))
    const r = await findCoverFor({ slug: 'inconnu-xyz', coverQuery: 'x' })
    expect(r).toHaveProperty('coverCheckedAt')
    expect(r?.cover).toBeUndefined()
  })
})

describe('searchUnsplash', () => {
  it('sans clé, renvoie une liste vide sans appel réseau', async () => {
    expect(await searchUnsplash('x')).toEqual([])
    expect($fetch).not.toHaveBeenCalled()
  })
  it('exclut les ids déjà proposés', async () => {
    runtimeConfig.unsplashAccessKey = 'k'
    const mk = (id: string) => ({ id, urls: { raw: `https://i/${id}?a=1`, small: 's' }, links: { html: 'h', download_location: 'd' }, user: { name: 'n', links: { html: 'h' } } })
    $fetch.mockResolvedValue({ results: [mk('a'), mk('b'), mk('c')] })
    const r = await searchUnsplash('q', { perPage: 2, exclude: ['a'] })
    expect(r.map((x) => x.id)).toEqual(['b', 'c'])
  })
})
