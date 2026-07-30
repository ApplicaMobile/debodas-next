"use server";

import { headers } from "next/headers";
import { getBodaBySlug } from "@/lib/bodas/queries";
import {
  getMicrositePassword,
  hashMicrositePassword,
  unlockMicrosite,
  verifyMicrositePassword,
} from "@/lib/microsite/password";
import {
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export interface UnlockState {
  error?: string;
  success?: boolean;
}

function parseOptions(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
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

  const stored = getMicrositePassword(boda.options);
  if (!stored) {
    return { error: "Este micrositio no está protegido." };
  }

  const verified = await verifyMicrositePassword(password, stored);
  if (!verified.ok) {
    return { error: "Contraseña incorrecta." };
  }

  let cookieSecret = stored;
  if (verified.legacyPlain) {
    // Migración lazy: plaintext → bcrypt
    try {
      const hashed = await hashMicrositePassword(password);
      const options = parseOptions(boda.options);
      options.password = hashed;
      await prisma.boda.update({
        where: { id: String(boda.id) },
        data: { options: options as Prisma.InputJsonValue },
      });
      cookieSecret = hashed;
    } catch (error) {
      console.error("[unlockMicrositeAction] rehash legacy", error);
    }
  }

  await unlockMicrosite(slug, cookieSecret);
  return { success: true };
}
