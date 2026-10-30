/** Validation et mise en forme du message de contact (partagé par la route serveur et les tests). */
export interface ContactInput { nom?: unknown; email?: unknown; message?: unknown; site?: unknown }
export interface ContactMessage { nom: string; email: string; message: string }
export type ContactCheck =
  | { ok: true; value: ContactMessage }
  | { ok: false; spam?: boolean; error: string }

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
export const CONTACT_LIMITS = { nom: 120, email: 200, message: 5000 }

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function checkContact(input: ContactInput): ContactCheck {
  // champ piège « site » : invisible pour une personne, rempli par les robots
  if (typeof input.site === 'string' && input.site.trim()) return { ok: false, spam: true, error: 'Message refusé.' }
  const nom = clean(input.nom, CONTACT_LIMITS.nom)
  const email = clean(input.email, CONTACT_LIMITS.email)
  const message = clean(input.message, CONTACT_LIMITS.message)
  if (!nom || !email || !message) return { ok: false, error: 'Merci de remplir le nom, l\'e-mail et le message.' }
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'L\'adresse e-mail n\'est pas valide.' }
  return { ok: true, value: { nom, email, message } }
}

/** Retire retours à la ligne et caractères de contrôle d'une valeur placée dans un en-tête (sujet). */
export const oneLine = (s: string) => s.replace(/[\r\n\u0000-\u001f]+/g, ' ').trim()

export function buildMail(m: ContactMessage) {
  return {
    subject: `Contact portfolio : ${oneLine(m.nom)}`.slice(0, 150),
    text: `${m.message}\n\n— ${oneLine(m.nom)} <${oneLine(m.email)}>`,
  }
}
