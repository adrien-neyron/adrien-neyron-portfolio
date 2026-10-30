import { describe, it, expect } from 'vitest'
import { buildMail, checkContact, oneLine } from '~/utils/contactMessage'

describe('checkContact', () => {
  it('accepte un message complet et nettoie les espaces', () => {
    const r = checkContact({ nom: '  Jean ', email: 'jean@ex.fr', message: ' Bonjour ' })
    expect(r).toEqual({ ok: true, value: { nom: 'Jean', email: 'jean@ex.fr', message: 'Bonjour' } })
  })
  it('refuse un champ vide ou une adresse invalide', () => {
    expect(checkContact({ nom: 'a', email: 'a@b.fr', message: '' }).ok).toBe(false)
    expect(checkContact({ nom: 'a', email: 'pas-un-mail', message: 'x' })).toMatchObject({ ok: false, error: expect.stringMatching(/e-mail/) })
    expect(checkContact({ nom: 1, email: {}, message: [] }).ok).toBe(false)
  })
  it('champ piège rempli : refus marqué spam', () => {
    expect(checkContact({ nom: 'a', email: 'a@b.fr', message: 'x', site: 'http://spam' })).toMatchObject({ ok: false, spam: true })
  })
  it('tronque les textes trop longs', () => {
    const r = checkContact({ nom: 'a', email: 'a@b.fr', message: 'x'.repeat(9000) })
    expect(r.ok && r.value.message.length).toBe(5000)
  })
})

describe('buildMail', () => {
  it('le sujet ne peut pas contenir de saut de ligne (injection d\'en-tête)', () => {
    expect(oneLine('a\r\nBcc: x@y.z')).not.toMatch(/[\r\n]/)
    expect(buildMail({ nom: 'a\r\nBcc: x@y.z', email: 'a@b.fr', message: 'm' }).subject).not.toMatch(/[\r\n]/)
  })
})
