import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_PREFIX = "debodas_unlock_";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días

function unlockToken(slug: string, password: string): string {
  return createHash("sha256").update(`debodas:${slug}:${password}`).digest("hex");
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

export async function isMicrositeUnlocked(
  slug: string,
  password: string,
): Promise<boolean> {
  if (!password) {
    return true;
  }

  const cookieStore = await cookies();
  const value = cookieStore.get(`${COOKIE_PREFIX}${slug}`)?.value;
  if (!value) {
    return false;
  }

  const expected = unlockToken(slug, password);
  try {
    return timingSafeEqual(Buffer.from(value, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

export async function unlockMicrosite(
  slug: string,
  password: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(`${COOKIE_PREFIX}${slug}`, unlockToken(slug, password), {
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
