import { createRemoteJWKSet, jwtVerify } from "jose";
import type { H3Event } from "h3";

export async function requireAuth(event: H3Event): Promise<void> {
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
    // ID token : audience = clientId (pas d'API audience nécessaire)
    await jwtVerify(token, JWKS, {
      issuer:   `https://${domain}/`,
      audience: config.public.auth0ClientId,
    });
  } catch (e) {
    console.error("[requireAuth] jwtVerify failed:", e);
    console.error("[requireAuth] domain:", domain, "| clientId:", config.public.auth0ClientId);
    throw createError({ statusCode: 401, statusMessage: "Invalid token" });
  }
}
