import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Garde-fou contre l'oubli d'authentification : toute route d'écriture (POST/PUT/PATCH/DELETE) doit appeler
 * requireAdminWrite, sauf liste blanche explicite et justifiée. Et rien dans /api/admin ne doit être public.
 */
const API = join(process.cwd(), 'server/api')
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
const files = walk(API).map((f) => relative(API, f))

const PUBLIC_WRITES: Record<string, string> = {
  'visitors.post.ts': 'compteur de visites (pas de donnée sensible, écriture bornée)',
  'contact.post.ts': 'formulaire de contact : validation, champ piège, 5 envois / 10 min / IP, aucune base de données',
}

describe('routes API', () => {
  it.each(files.filter((f) => f.startsWith('admin/')))('%s exige requireAdminWrite', (f) => {
    expect(readFileSync(join(API, f), 'utf8')).toMatch(/await\s+requireAdminWrite\(event\)/)
  })

  it.each(files.filter((f) => /\.(post|put|patch|delete)\.ts$/.test(f) && !f.startsWith('admin/')))(
    "%s (écriture hors admin) est dans la liste blanche",
    (f) => { expect(Object.keys(PUBLIC_WRITES)).toContain(f) },
  )

  it('la requireAdminWrite est appelée AVANT toute connexion base de données', () => {
    for (const f of files.filter((x) => x.startsWith('admin/'))) {
      const src = readFileSync(join(API, f), 'utf8')
      const auth = src.indexOf('requireAdminWrite(event)')
      const db = src.search(/dbConnect\(|getPool\(|readBody\(|readMultipartFormData\(/)
      if (db !== -1) expect(auth, f).toBeLessThan(db)
    }
  })
})
