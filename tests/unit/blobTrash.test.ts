import { describe, it, expect } from 'vitest'
import { isBlobUrl, urlsToDelete } from '~/utils/blobTrash'

const A = 'https://abc123.public.blob.vercel-storage.com/1-a.webp'
const B = 'https://abc123.public.blob.vercel-storage.com/2-b.webp'

describe('blobTrash', () => {
  it('reconnaît seulement les URLs du Blob store', () => {
    expect(isBlobUrl(A)).toBe(true)
    expect(isBlobUrl('/recentprojects/ucpa-cover.webp')).toBe(false)
    expect(isBlobUrl('https://images.unsplash.com/photo-1.jpg')).toBe(false)
    expect(isBlobUrl('http://abc.public.blob.vercel-storage.com/x.webp')).toBe(false)
    expect(isBlobUrl('https://evil.com/?u=.public.blob.vercel-storage.com')).toBe(false)
    expect(isBlobUrl(undefined)).toBe(false)
  })
  it("supprime l'ancienne image remplacée", () => {
    expect(urlsToDelete([A], { image: B })).toEqual([A])
  })
  it("garde une image encore utilisée dans ce qui vient d'être enregistré", () => {
    expect(urlsToDelete([A, B], { images: [{ src: B }] })).toEqual([A])
  })
  it('ignore les doublons et les fichiers hors Blob', () => {
    expect(urlsToDelete([A, A, '/img/x.webp'], {})).toEqual([A])
  })
})
