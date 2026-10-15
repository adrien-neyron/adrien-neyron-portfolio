import { createRemoteJWKSet, jwtVerify } from "jose";
import type { H3Event } from "h3";

interface JWTPayload {
  email?: string;
  sub?: string;
  [key: string]: unknown;
}

export async function requireAuth(event: H3Event): Promise<JWTPayload> {
  const authorization = getHeader(event, "authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const token = authorization.slice(7);
  const config = useRuntimeConfig();
  const domain = config.public.auth0Domain;

  const JWKS = createRemoteJWKSet(
    new URL(`https://${domain}/.well-known/jwks.json`)
  );

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer:   `https://${domain}/`,
      audience: config.public.auth0ClientId,
    });
    return payload as JWTPayload;
  } catch (e) {
    console.error("[requireAuth] jwtVerify failed:", e);
    throw createError({ statusCode: 401, statusMessage: "Invalid token" });
  }
}

/** Seul ADMIN_EMAIL (comparaison exacte) est administrateur ; vide = personne. */
function isAdminEmail(email: unknown): boolean {
  const adminEmail = useRuntimeConfig().adminEmail;
  return Boolean(adminEmail) && email === adminEmail;
}

/**
 * Rôle du visiteur pour l'interface /admin (lecture seule ou édition).
 * Ne lève jamais : pas de jeton ou jeton invalide = simple visiteur.
 * Purement indicatif côté interface — l'écriture reste gardée par requireAdminWrite.
 */
export async function isAdminRequest(event: H3Event): Promise<boolean> {
  if (!getHeader(event, "authorization")?.startsWith("Bearer ")) return false;
  try {
    const payload = await requireAuth(event);
    return isAdminEmail(payload.email);
  } catch {
    return false;
  }
}

export async function requireAdminWrite(event: H3Event): Promise<void> {
  const payload = await requireAuth(event);
  const adminEmail = useRuntimeConfig().adminEmail;

  if (!isAdminEmail(payload.email)) {
    // Diagnostic : ne révèle rien au client (toujours 403 générique), mais
    // trace côté serveur (Vercel → Runtime Logs) l'email reçu du token vs
    // celui attendu, pour distinguer "ADMIN_EMAIL absent en prod" d'un
    // simple mismatch de casse/espace/compte de connexion.
    console.error(
      "[requireAdminWrite] Forbidden — token email:", JSON.stringify(payload.email),
      "| expected ADMIN_EMAIL:", adminEmail ? JSON.stringify(adminEmail) : "(non défini)"
    );
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }
}
