"use server";

import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { getAppUrl, sendEmail } from "@/lib/email/client";
import { prisma } from "@/lib/db/prisma";
import {
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/security/rate-limit";

export interface PasswordResetState {
  error?: string;
  success?: string;
}

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

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Ingresá un email válido." };
  }

  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const limited = checkRateLimit(`reset:${ip}:${email}`, 5, 15 * 60 * 1000);
  if (!limited.ok) {
    return {
      error: `Demasiados intentos. Probá en ${limited.retryAfterSec}s.`,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  // Respuesta genérica para no filtrar si el email existe
  const genericSuccess =
    "Si ese email está registrado, te enviamos un enlace para restablecer la contraseña.";

  if (!user) {
    return { success: genericSuccess };
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const resetUrl = `${getAppUrl()}/recuperar/${token}`;
  const result = await sendEmail({
    to: user.email,
    subject: "Restablecer contraseña — DeBodas",
    html: `<p>Hola${user.name ? ` ${user.name}` : ""},</p>
<p>Pediste restablecer tu contraseña. Este enlace vence en 1 hora:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Si no fuiste vos, ignorá este mensaje.</p>`,
    meta: { type: "password_reset", userId: user.id },
  });

  if (result.simulated) {
    return {
      success: `${genericSuccess} (modo local: email simulado, usá el link del log del servidor o pedí RESEND_API_KEY).`,
    };
  }

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

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== passwordConfirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const limited = checkRateLimit(`reset-confirm:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return {
      error: `Demasiados intentos. Probá en ${limited.retryAfterSec}s.`,
    };
  }

  const tokenHash = hashToken(token);
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

  const passwordHash = await hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    }),
  ]);

  return {
    success: "Contraseña actualizada. Ya podés iniciar sesión.",
  };
}
