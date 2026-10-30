import { buildMail, checkContact } from "~/utils/contactMessage";

/**
 * Envoi du message de contact (formulaire du Bivouac et page /contact).
 * Service : Resend (offre gratuite : 100 mails/jour, 3 000/mois), appelé en HTTP, sans dépendance.
 * Variables : RESEND_API_KEY (obligatoire), CONTACT_TO (défaut : ADMIN_EMAIL), CONTACT_FROM (défaut : onboarding@resend.dev).
 * Sans domaine vérifié chez Resend, l'expéditeur par défaut ne peut écrire qu'à l'adresse du compte Resend.
 */
const hits = new Map<string, number[]>();   // limite par IP, au mieux (mémoire de l'instance serverless)
const WINDOW_MS = 10 * 60_000, MAX_HITS = 5;

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event);
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "inconnue";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    throw createError({ statusCode: 429, statusMessage: "Trop de messages envoyés. Réessayez dans quelques minutes." });
  }

  const check = checkContact((await readBody(event).catch(() => ({}))) ?? {});
  if (!check.ok) {
    if (check.spam) return { ok: true };   // les robots croient avoir réussi, rien n'est envoyé
    throw createError({ statusCode: 400, statusMessage: check.error });
  }
  if (!cfg.resendApiKey) {
    throw createError({ statusCode: 503, statusMessage: "L'envoi n'est pas configuré sur le serveur." });
  }

  recent.push(now);
  hits.set(ip, recent);
  const mail = buildMail(check.value);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: cfg.contactFrom,
      to: [cfg.contactTo],
      reply_to: check.value.email,
      subject: mail.subject,
      text: mail.text,
    }),
  }).catch(() => null);
  if (!res || !res.ok) {
    console.error("[contact] Resend", res?.status, res ? await res.text().catch(() => "") : "injoignable");
    throw createError({ statusCode: 502, statusMessage: "Le service d'envoi n'a pas répondu." });
  }
  return { ok: true };
});
