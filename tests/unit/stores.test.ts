import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectsStore } from '~/stores/projects'
import { useCarnetStore } from '~/stores/carnet'
import { useAiToolsStore } from '~/stores/aiTools'
import { useProfileStore, staticProfileFallback } from '~/stores/profile'
import { useVisitorStore } from '~/stores/visitor'
import { projects as staticProjects } from '~/data/projects'
import { carnetArticles } from '~/data/carnet'
import { aiTools } from '~/data/ai-tools'

const $fetch = vi.fn()
beforeEach(() => { setActivePinia(createPinia()); $fetch.mockReset(); vi.stubGlobal('$fetch', $fetch) })

/** Règle commune des stores : si l'API est vide ou en panne, le site s'affiche quand même (repli statique). */
describe('stores — repli quand la base est vide ou indisponible', () => {
  it('projets : API en panne → liste statique + message d’erreur', async () => {
    $fetch.mockRejectedValue(new Error('500'))
    const s = useProjectsStore(); await s.fetchProjects()
    expect(s.projects).toHaveLength(staticProjects.length)
    expect(s.error).toBeTruthy(); expect(s.loading).toBe(false)
  })
  it('projets : réponse vide → liste statique, sans erreur', async () => {
    $fetch.mockResolvedValue([])
    const s = useProjectsStore(); await s.fetchProjects()
    expect(s.projects).toHaveLength(staticProjects.length); expect(s.error).toBeNull()
  })
  it('projets : un projet sans photo récupère celle du même slug (data/projects.ts), la photo admin gagne toujours', async () => {
    const withCover = staticProjects.find((p) => p.cover)!
    $fetch.mockResolvedValue([
      { _id: '1', slug: withCover.id, title: 'x', role: '', description: '', technologies: [] },
      { _id: '2', slug: withCover.id, title: 'y', role: '', description: '', technologies: [], cover: 'https://admin/photo.jpg' },
    ])
    const s = useProjectsStore(); await s.fetchProjects()
    expect(s.projects[0].cover).toBe(withCover.cover)
    expect(s.projects[1].cover).toBe('https://admin/photo.jpg')
  })
  it('projets : second appel = cache, pas de nouvelle requête', async () => {
    $fetch.mockResolvedValue([{ _id: '1', slug: 'a', title: 'A', role: '', description: '', technologies: [] }])
    const s = useProjectsStore(); await s.fetchProjects(); await s.fetchProjects()
    expect($fetch).toHaveBeenCalledTimes(1)
  })
  it('carnet : panne / vide → articles statiques', async () => {
    $fetch.mockRejectedValueOnce(new Error('x'))
    const a = useCarnetStore(); await a.fetchArticles()
    expect(a.articles).toHaveLength(carnetArticles.length); expect(a.error).toBeTruthy()
    setActivePinia(createPinia()); $fetch.mockResolvedValueOnce([])
    const b = useCarnetStore(); await b.fetchArticles()
    expect(b.articles).toHaveLength(carnetArticles.length)
  })
  it('outils IA : panne → outils statiques', async () => {
    $fetch.mockRejectedValue(new Error('x'))
    const s = useAiToolsStore(); await s.fetchAiTools()
    expect(s.tools).toHaveLength(aiTools.length)
  })
  it('profil : fusion avec le repli (champs absents en base = valeurs par défaut) et rechargement forcé', async () => {
    $fetch.mockResolvedValue({ name: 'Nom modifié' })
    const s = useProfileStore(); await s.fetchProfile()
    expect(s.profile.name).toBe('Nom modifié')
    expect(s.profile.email).toBe(staticProfileFallback.email)
    await s.fetchProfile(); expect($fetch).toHaveBeenCalledTimes(1)
    await s.fetchProfile(true); expect($fetch).toHaveBeenCalledTimes(2)
  })
  it('profil : panne → profil statique', async () => {
    $fetch.mockRejectedValue(new Error('x'))
    const s = useProfileStore(); await s.fetchProfile()
    expect(s.profile).toEqual(staticProfileFallback); expect(s.error).toBeTruthy()
  })
})

describe('store visiteur', () => {
  it('ne compte qu’une visite par navigateur', async () => {
    const mem = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) })
    $fetch.mockResolvedValue({ count: 42 })
    const s = useVisitorStore()
    await s.trackVisit(); await s.trackVisit()
    expect($fetch).toHaveBeenCalledTimes(1)
    expect($fetch.mock.calls[0][1]).toMatchObject({ method: 'POST' })
    expect(s.count).toBe(42)
  })
})
