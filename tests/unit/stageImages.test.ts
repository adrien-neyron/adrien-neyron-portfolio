import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { stageImageFallback, stageImageByStage } from '~/data/stageImages'

const local = (src: string) => src.startsWith('/') && !src.startsWith('//')

describe('images de repli des étapes', () => {
  it('chaque image locale existe dans public/ (pas d\'aperçu cassé)', () => {
    const srcs = [...Object.values(stageImageFallback).map((x) => x.src), ...Object.values(stageImageByStage).flat().map((x) => x.src)]
    for (const s of srcs.filter(local)) expect(existsSync(join(process.cwd(), 'public', s)), s).toBe(true)
  })
  it('le Départ a ses images (UCPA, Decathlon), avec un titre et un crédit', () => {
    expect(stageImageByStage.depart.map((x) => x.title)).toEqual(['UCPA Formation', 'Decathlon'])
    for (const x of stageImageByStage.depart) expect(x.credit).toBeTruthy()
  })
  it('C+Paie est illustré par une capture du site, plus par une photo hotlinkée', () => {
    expect(stageImageFallback['Service-Gestion de paie'].src).toBe('/recentprojects/cpluspaie-cover.webp')
  })
})
