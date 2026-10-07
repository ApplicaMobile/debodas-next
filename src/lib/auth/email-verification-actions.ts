"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";
import { isAccountActive } from "@/lib/account/status";
import { confirmEmailVerification } from "@/lib/auth/email-verification";
import {
  sendEmailVerificationCodeTo,
  verificationCodeSecret,
} from "@/lib/auth/email-verification-server";
import { isAdminRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { VERIFICATION_CODE_TTL_MS } from "@/lib/auth/verification-code";
import { prisma } from "@/lib/db/prisma";
import { startPlanCheckout } from "@/lib/payments/plan-checkout";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/security/rate-limit";

export interface EmailVerificationState {
  error?: string;
  info?: string;
  /** epoch ms: cuándo se puede pedir otro código. */
  resendAvailableAt?: number;
  /** Verificado: el cliente navega acá (puede ser el checkout externo de MercadoPago). */
  redirectTo?: string;
}

const HOUR_MS = 60 * 60 * 1000;

async function limited(keys: Array<[string, number, number]>): Promise<number | null> {
  const results = await Promise.all(keys.map(([key, max, win]) => checkRateLimit(key, max, win)));
  const hit = results.find((r) => !r.ok);
  return hit && !hit.ok ? hit.retryAfterSec : null;
}

async function loadPendingUser() {
  const session = await getSession();
  if (!session) redirect("/login?next=/registro/verificar");
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, status: true, emailVerifiedAt: true },
  });
  if (!user || !isAccountActive(user.status)) redirect("/login");
  if (user.emailVerifiedAt || isAdminRole(user.role)) {
    redirect(isAdminRole(user.role) ? "/" : "/mi-cuenta");
  }
  return user;
}

async function resend(): Promise<EmailVerificationState> {
  const { messages } = await getDictionary();
  const user = await loadPendingUser();
  const ip = clientIpFromHeaders(await headers());
  const wait = await limited([
    [`verify-email:send:user:${user.id}`, 6, HOUR_MS],
    [`verify-email:send:ip:${ip}`, 20, HOUR_MS],
  ]);
  if (wait !== null) {
    return { error: t(messages, "emailVerification.errorRateLimit", { seconds: wait }) };
  }

  const sent = await sendEmailVerificationCodeTo({ userId: user.id, email: user.email, name: user.name });
  if (!sent.ok) {
    if (sent.error === "cooldown") {
      return {
        error: t(messages, "emailVerification.errorCooldown", { seconds: sent.retryAfterSec }),
        resendAvailableAt: Date.now() + sent.retryAfterSec * 1000,
      };
    }
    return { error: t(messages, "emailVerification.errorEmail") };
  }
  return {
    info: t(messages, "emailVerification.codeSent", {
      email: user.email,
      minutes: Math.round(VERIFICATION_CODE_TTL_MS / 60000),
    }),
    resendAvailableAt: sent.resendAvailableAt.getTime(),
  };
}

async function confirm(formData: FormData): Promise<EmailVerificationState> {
  const { messages } = await getDictionary();
  const user = await loadPendingUser();
  const ip = clientIpFromHeaders(await headers());
  const wait = await limited([
    [`verify-email:confirm:user:${user.id}`, 10, 15 * 60 * 1000],
    [`verify-email:confirm:ip:${ip}`, 30, 15 * 60 * 1000],
  ]);
  if (wait !== null) {
    return { error: t(messages, "emailVerification.errorRateLimit", { seconds: wait }) };
  }

  const outcome = await confirmEmailVerification(
    prisma,
    { userId: user.id, code: String(formData.get("code") ?? ""), secret: verificationCodeSecret() },
    {
      startPlanCheckout,
      logError: (scope, error) => console.error(scope, error),
    },
  );
  if (outcome.ok) return { redirectTo: outcome.redirectTo };

  switch (outcome.error) {
    case "invalid":
      return {
        error: t(messages, "emailVerification.errorInvalid", { attempts: outcome.attemptsLeft ?? 0 }),
      };
    case "format":
      return { error: t(messages, "emailVerification.errorFormat") };
    case "expired":
      return { error: t(messages, "emailVerification.errorExpired") };
    case "too_many":
      return { error: t(messages, "emailVerification.errorTooMany") };
    case "missing":
      return { error: t(messages, "emailVerification.errorMissing") };
    default:
      return { error: t(messages, "emailVerification.errorGeneric") };
  }
}

/** Única acción de la pantalla del código (useActionState): intent = confirm | resend. */
export async function emailVerificationAction(
  _prev: EmailVerificationState,
  formData: FormData,
): Promise<EmailVerificationState> {
  return String(formData.get("intent") ?? "confirm") === "resend" ? resend() : confirm(formData);
}