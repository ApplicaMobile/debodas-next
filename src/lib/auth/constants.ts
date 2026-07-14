export const SESSION_COOKIE = "debodas_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET no está configurado o es muy corto. Agregalo en .env.local",
    );
  }
  return new TextEncoder().encode(secret);
}
