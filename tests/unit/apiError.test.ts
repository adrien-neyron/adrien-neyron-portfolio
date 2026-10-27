import { describe, it, expect } from 'vitest'
import { apiErrorMessage } from '~/utils/apiError'

describe('apiErrorMessage', () => {
  it('dit ce qui s\'est passé et quoi faire selon le code', () => {
    expect(apiErrorMessage({ statusCode: 401 }, "créer l'étape").message).toMatch(/session a expiré/)
    expect(apiErrorMessage({ statusCode: 403 }, "créer l'étape").message).toMatch(/pas le droit/)
    expect(apiErrorMessage({ statusCode: 404 }, "enregistrer l'étape").message).toMatch(/n'existe plus/)
    expect(apiErrorMessage({ statusCode: 500 }, "créer l'étape").message).toMatch(/base de données/)
    expect(apiErrorMessage({}, "créer l'étape").message).toMatch(/ne répond pas/)
  })
  it('409 : reprend la clé du serveur', () => {
    const r = apiErrorMessage({ statusCode: 409, statusMessage: 'la clé « x » est déjà utilisée' }, "créer l'étape")
    expect(r.message).toContain('« x »')
  })
  it('422 : renvoie la liste des champs fautifs', () => {
    const errors = [{ field: 'title' as const, message: 'Le titre est obligatoire' }]
    const r = apiErrorMessage({ statusCode: 422, data: { data: { errors } } }, "créer l'étape")
    expect(r.issues).toEqual(errors)
    expect(r.message).toMatch(/ci-dessous/)
  })
})
