import { describe, it, expect } from 'vitest'
import { fitSize, webpName, isConvertible, formatKo } from '~/utils/imageWebp'

describe('imageWebp', () => {
  it('réduit le grand côté à 1600 px sans jamais agrandir', () => {
    expect(fitSize(4000, 3000)).toEqual({ width: 1600, height: 1200 })
    expect(fitSize(800, 500)).toEqual({ width: 800, height: 500 })
    expect(fitSize(1000, 4000, 1600)).toEqual({ width: 400, height: 1600 })
  })
  it('nomme le fichier en .webp, sans accents ni espaces', () => {
    expect(webpName('Photo Été.JPG')).toBe('photo-ete.webp')
    expect(webpName('???.png')).toBe('image.webp')
  })
  it('ne convertit que les formats raster fixes', () => {
    expect(isConvertible('image/jpeg')).toBe(true)
    expect(isConvertible('image/png')).toBe(true)
    expect(isConvertible('image/svg+xml')).toBe(false)
    expect(isConvertible('image/gif')).toBe(false)
    expect(isConvertible('application/pdf')).toBe(false)
  })
  it('formate les tailles', () => {
    expect(formatKo(2048)).toBe('2 Ko')
    expect(formatKo(3 * 1048576)).toBe('3.0 Mo')
  })
})
