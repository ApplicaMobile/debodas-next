import { getLocaleOrDefault } from "@/i18n/get-locale";
import { getAuthSecret } from "@/lib/auth/constants";
import {
  sendEmailVerificationCode,
  type SendEmailVerificationResult,
} from "@/lib/auth/email-verification";
import { prisma } from "@/lib/db/prisma";
import { enqueueEmail } from "@/lib/email/queue";

/** Secreto del HMAC de los códigos (AUTH_SECRET). */
export function verificationCodeSecret(): string {
  return new TextDecoder().decode(getAuthSecret());
}

/** Envía el código de verificación con las dependencias reales (Prisma, cola de emails, idioma actual). */
export async function sendEmailVerificationCodeTo(user: {
  userId: string;
  email: string;
  name?: string | null;
}): Promise<SendEmailVerificationResult> {
  return sendEmailVerificationCode(
    prisma,
    {
      userId: user.userId,
      email: user.email,
      name: user.name,
      locale: await getLocaleOrDefault(),
      secret: verificationCodeSecret(),
    },
    { enqueue: enqueueEmail },
  );
}