import { createHash, timingSafeEqual } from "crypto";
import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_PREFIX = "debodas_unlock_";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días
const BCRYPT_ROUNDS = 10;

function unlockToken(slug: string, passwordSecret: string): string {
  return createHash("sha256")
    .update(`debodas:${slug}:${passwordSecret}`)
    .digest("hex");
}

/** bcrypt hashes empiezan con $2a$ / $2b$ / $2y$ */
export function isMicrositePasswordHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

export function getMicrositePassword(options: unknown): string {
  if (!options || typeof options !== "object") {
    return "";
  }
  const password = (options as Record<string, unknown>).password;
  return typeof password === "string" ? password.trim() : "";
}

export function micrositeRequiresPassword(options: unknown): boolean {
  return getMicrositePassword(options).length > 0;
}

export async function hashMicrositePassword(plain: string): Promise<string> {
  return hash(plain.trim(), BCRYPT_ROUNDS);
}

/**
 * Verifica input contra hash bcrypt o plaintext legacy.
 * Devuelve `legacyPlain` si coincidió texto plano (para rehash al guardar).
 */
export async function verifyMicrositePassword(
  input: string,
  stored: string,
): Promise<{ ok: boolean; legacyPlain?: boolean }> {
  const plain = input.trim();
  const expected = stored.trim();
  if (!plain || !expected) {
    return { ok: false };
  }

  if (isMicrositePasswordHash(expected)) {
    const ok = await compare(plain, expected);
    return { ok };
  }

  // Legacy: guardado en claro
  if (passwordsMatch(plain, expected)) {
    return { ok: true, legacyPlain: true };
  }
  return { ok: false };
}

export async function isMicrositeUnlocked(
  slug: string,
  passwordSecret: string,
): Promise<boolean> {
  if (!passwordSecret) {
    return true;
  }

  const cookieStore = await cookies();
  const value = cookieStore.get(`${COOKIE_PREFIX}${slug}`)?.value;
  if (!value) {
    return false;
  }

  const expected = unlockToken(slug, passwordSecret);
  try {
    return timingSafeEqual(
      Buffer.from(value, "utf8"),
      Buffer.from(expected, "utf8"),
    );
  } catch {
    return false;
  }
}

export async function unlockMicrosite(
  slug: string,
  passwordSecret: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(`${COOKIE_PREFIX}${slug}`, unlockToken(slug, passwordSecret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function passwordsMatch(input: string, expected: string): boolean {
  const a = Buffer.from(input.trim(), "utf8");
  const b = Buffer.from(expected.trim(), "utf8");
  if (a.length !== b.length) {
    return false;
  }
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
