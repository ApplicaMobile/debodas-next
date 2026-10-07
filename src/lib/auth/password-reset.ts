"use server";

import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { getAppUrl } from "@/lib/email/client";
import { enqueueEmail } from "@/lib/email/queue";
import { passwordResetEmail } from "@/lib/email/password-reset-template";
import { getLocaleOrDefault } from "@/i18n/get-locale";
import { prisma } from "@/lib/db/prisma";
import { isAccountActive } from "@/lib/account/status";
import {
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/security/rate-limit";

export interface PasswordResetState {
  error?: string;
  success?: string;
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordResetAction(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const website = String(formData.get("website") ?? "").trim();
  const genericSuccess =
    "Si ese email está registrado, te enviamos un enlace para restablecer la contraseña.";

  if (website) {
    return { success: genericSuccess };
  }

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { error: "Ingresá un email válido." };
  }

  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit(`reset:ip:${ip}`, 10, 60 * 60 * 1000),
    checkRateLimit(`reset:email:${email}`, 5, 60 * 60 * 1000),
  ]);
  const limited = !ipLimit.ok ? ipLimit : emailLimit;
  if (!limited.ok) {
    return {
      error: `Demasiados intentos. Probá en ${limited.retryAfterSec}s.`,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, status: true },
  });

  // Respuesta genérica para no filtrar si el email existe (ni si está suspendida/eliminada)
  if (!user || !isAccountActive(user.status)) {
    return { success: genericSuccess };
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const resetUrl = `${getAppUrl()}/recuperar/${token}`;
  const resetEmail = passwordResetEmail({
    locale: await getLocaleOrDefault(),
    resetUrl,
    name: user.name,
    minutes: RESET_TOKEN_TTL_MS / 60000,
  });
  await enqueueEmail({
    to: user.email,
    subject: resetEmail.subject,
    html: resetEmail.html,
    type: "password_reset",
    dedupeKey: `password-reset:${tokenHash}`,
    meta: { userId: user.id },
  });

  return { success: genericSuccess };
}

export async function resetPasswordAction(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");

  if (!token) {
    return { error: "Enlace inválido." };
  }

  if (password.length < 8 || password.length > 72) {
    return {
      error: "La contraseña debe tener entre 8 y 72 caracteres.",
    };
  }

  if (password !== passwordConfirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const tokenHash = hashToken(token);
  const limited = await checkRateLimit(
    `reset-confirm:${ip}:${tokenHash}`,
    10,
    15 * 60 * 1000,
  );
  if (!limited.ok) {
    return {
      error: `Demasiados intentos. Probá en ${limited.retryAfterSec}s.`,
    };
  }

  const record = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    return { error: "El enlace expiró o no es válido. Pedí uno nuevo." };
  }

  const owner = await prisma.user.findUnique({
    where: { id: record.userId },
    select: { status: true },
  });
  if (!owner || !isAccountActive(owner.status)) {
    return { error: "El enlace expiró o no es válido. Pedí uno nuevo." };
  }

  const passwordHash = await hash(password, 10);
  const consumed = await prisma.$transaction(async (tx) => {
    const result = await tx.passwordResetToken.updateMany({
      where: {
        id: record.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });
    if (result.count !== 1) {
      return false;
    }
    await tx.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        // La clave nueva reemplaza también al hash legado de WordPress.
        legacyPasswordHash: null,
        sessionVersion: { increment: 1 },
      },
    });
    // Usar el enlace del email prueba que la dirección es suya.
    await tx.user.updateMany({
      where: { id: record.userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });
    await tx.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    });
    return true;
  });

  if (!consumed) {
    return { error: "El enlace ya fue utilizado o expiró. Pedí uno nuevo." };
  }

  return {
    success: "Contraseña actualizada. Ya podés iniciar sesión.",
  };
}
