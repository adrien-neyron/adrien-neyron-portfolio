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

export async function requireAdminWrite(event: H3Event): Promise<void> {
  const payload = await requireAuth(event);
  const config  = useRuntimeConfig();
  const adminEmail = config.adminEmail;

  if (!adminEmail || payload.email !== adminEmail) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }
}
