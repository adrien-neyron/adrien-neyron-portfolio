import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { stageImageFallback } from '~/data/stageImages'
import { stages } from '~/data/stages'

const local = (src: string) => src.startsWith('/') && !src.startsWith('//')

describe('images des étapes', () => {
  it('chaque image locale (repli par projet et images d\'étape) existe dans public/ : pas d\'aperçu cassé', () => {
    const srcs = [...Object.values(stageImageFallback).map((x) => x.src), ...stages.flatMap((s) => (s.images || []).map((i) => i.src))]
    for (const s of srcs.filter(local)) expect(existsSync(join(process.cwd(), 'public', s)), s).toBe(true)
  })
  it('le Départ porte ses images (UCPA, Decathlon) dans data/stages.ts, avec un titre', () => {
    const d = stages.find((s) => s.kind === 'depart')!
    expect(d.images!.map((x) => x.title)).toEqual(['UCPA Formation', 'Decathlon'])
  })
  it('C+Paie est illustré par une capture du site, plus par une photo hotlinkée', () => {
    expect(stageImageFallback['Service-Gestion de paie'].src).toBe('/recentprojects/cpluspaie-cover.webp')
  })
})
