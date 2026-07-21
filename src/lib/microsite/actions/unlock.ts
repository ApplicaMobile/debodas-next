"use server";

import { headers } from "next/headers";
import { getBodaBySlug } from "@/lib/bodas/queries";
import {
  getMicrositePassword,
  passwordsMatch,
  unlockMicrosite,
} from "@/lib/microsite/password";
import {
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/security/rate-limit";

export interface UnlockState {
  error?: string;
  success?: boolean;
}

export async function unlockMicrositeAction(
  _prev: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);

  const limited = await checkRateLimit(
    `unlock:${slug}:${ip}`,
    10,
    15 * 60 * 1000,
  );
  if (!limited.ok) {
    return {
      error: `Demasiados intentos. Probá en ${limited.retryAfterSec}s.`,
    };
  }

  if (!slug || !password) {
    return { error: "Ingresá la contraseña." };
  }

  const boda = await getBodaBySlug(slug);
  if (!boda) {
    return { error: "Micrositio no encontrado." };
  }

  const expected = getMicrositePassword(boda.options);
  if (!expected) {
    return { error: "Este micrositio no está protegido." };
  }

  if (!passwordsMatch(password, expected)) {
    return { error: "Contraseña incorrecta." };
  }

  await unlockMicrosite(slug, expected);
  return { success: true };
}
