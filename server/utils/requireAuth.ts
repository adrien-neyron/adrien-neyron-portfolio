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
    await jwtVerify(token, JWKS, {
      issuer:   `https://${domain}/`,
      audience: config.public.auth0Audience,
    });
  } catch {
    throw createError({ statusCode: 401, statusMessage: "Invalid token" });
  }
}
