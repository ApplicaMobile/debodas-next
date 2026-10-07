import type { Prisma, PrismaClient } from "@prisma/client";
import type { Locale } from "@/i18n/config";
import {
  discardVerificationCode,
  issueVerificationCode,
  VERIFICATION_CODE_TTL_MS,
  verifyVerificationCode,
  type VerifyVerificationCodeResult,
} from "@/lib/auth/verification-code";
import {
  PENDING_SIGNUP_PLAN_KEY,
  REGISTER_CHECKOUT_ERROR_REDIRECT,
  REGISTER_HOME_REDIRECT,
} from "@/lib/auth/register-account";
import { registrationCodeEmail } from "@/lib/email/verification-code-template";
import { getPlanProduct, type PurchasablePlan } from "@/lib/plans/pricing";

/**
 * Verificación del email tras el registro (código de 6 dígitos, `verification_codes`
 * con purpose = email_verification). Sin dependencias de Next: se testea con fake-prisma.
 *
 * Mientras no esté verificado: el login lleva a /registro/verificar, /mi-cuenta redirige ahí,
 * no se puede pagar un plan y el micrositio se trata como offline (solo vista previa).
 */
export const EMAIL_VERIFICATION_PURPOSE = "email_verification" as const;

export function isEmailVerified(user: { emailVerifiedAt: Date | null | undefined }): boolean {
  return user.emailVerifiedAt !== null;
}

export interface VerificationEmailSender {
  enqueue(input: {
    to: string;
    subject: string;
    html: string;
    type: string;
    dedupeKey: string;
    meta: Record<string, unknown>;
  }): Promise<{ skipped: boolean }>;
}

export type SendEmailVerificationResult =
  | { ok: true; expiresAt: Date; resendAvailableAt: Date }
  | { ok: false; error: "cooldown"; retryAfterSec: number }
  | { ok: false; error: "email" };

/** Genera el código (respetando el cooldown) y lo encola por email con la plantilla nueva. */
export async function sendEmailVerificationCode(
  db: PrismaClient,
  input: {
    userId: string;
    email: string;
    name?: string | null;
    locale: Locale;
    secret: string;
    now?: Date;
    code?: string;
  },
  deps: VerificationEmailSender & { logError?: (scope: string, error: unknown) => void },
): Promise<SendEmailVerificationResult> {
  const target = { userId: input.userId, purpose: EMAIL_VERIFICATION_PURPOSE };
  const issued = await issueVerificationCode(db, {
    ...target,
    secret: input.secret,
    now: input.now,
    code: input.code,
  });
  if (!issued.ok) return issued;

  const email = registrationCodeEmail({
    locale: input.locale,
    code: issued.code,
    minutes: Math.round(VERIFICATION_CODE_TTL_MS / 60000),
    name: input.name,
  });
  try {
    const queued = await deps.enqueue({
      to: input.email,
      subject: email.subject,
      html: email.html,
      type: "email_verification_code",
      dedupeKey: `email-verification-code:${input.userId}:${issued.expiresAt.getTime()}`,
      meta: { userId: input.userId },
    });
    if (queued.skipped) throw new Error("email skipped");
  } catch (error) {
    (deps.logError ?? console.error)("[email verification] no se pudo encolar el código", error);
    // Sin email no hay forma de verificar: liberamos el cooldown para reintentar.
    await discardVerificationCode(db, target);
    return { ok: false, error: "email" };
  }
  return { ok: true, expiresAt: issued.expiresAt, resendAvailableAt: issued.resendAvailableAt };
}

/** Plan pago guardado en el registro (validado contra el catálogo). */
export function pendingSignupPlan(misc: unknown): PurchasablePlan | null {
  if (!misc || typeof misc !== "object" || Array.isArray(misc)) return null;
  const value = (misc as Record<string, unknown>)[PENDING_SIGNUP_PLAN_KEY];
  return typeof value === "string" ? (getPlanProduct(value)?.slug ?? null) : null;
}

export interface ConfirmEmailVerificationDeps {
  startPlanCheckout(input: {
    bodaId: string;
    email: string;
    plan: PurchasablePlan;
  }): Promise<{ initPoint: string }>;
  logError?(scope: string, error: unknown): void;
}

export type ConfirmEmailVerificationResult =
  | { ok: true; redirectTo: string; plan: PurchasablePlan | null }
  | Extract<VerifyVerificationCodeResult, { ok: false }>
  | { ok: false; error: "not_found" };

/**
 * Código correcto y vigente -> marca el email como verificado y sigue como antes del cambio:
 * plan pago -> checkout de MercadoPago (startPlanCheckout); gratis -> /mi-cuenta.
 */
export async function confirmEmailVerification(
  db: PrismaClient,
  input: { userId: string; code: string; secret: string; now?: Date },
  deps: ConfirmEmailVerificationDeps,
): Promise<ConfirmEmailVerificationResult> {
  const now = input.now ?? new Date();
  const logError = deps.logError ?? ((scope: string, error: unknown) => console.error(scope, error));

  const verified = await verifyVerificationCode(db, {
    userId: input.userId,
    purpose: EMAIL_VERIFICATION_PURPOSE,
    code: input.code,
    secret: input.secret,
    now,
  });
  if (!verified.ok) return verified;

  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      email: true,
      emailVerifiedAt: true,
      boda: { select: { id: true, misc: true } },
    },
  });
  if (!user) return { ok: false, error: "not_found" };

  if (!user.emailVerifiedAt) {
    await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: now } });
  }

  const plan = user.boda ? pendingSignupPlan(user.boda.misc) : null;
  if (user.boda && user.boda.misc && typeof user.boda.misc === "object" && !Array.isArray(user.boda.misc)) {
    const misc = { ...(user.boda.misc as Record<string, Prisma.InputJsonValue>) };
    if (PENDING_SIGNUP_PLAN_KEY in misc) {
      delete misc[PENDING_SIGNUP_PLAN_KEY];
      await db.boda.update({ where: { id: user.boda.id }, data: { misc } });
    }
  }

  if (!plan || !user.boda) {
    return { ok: true, redirectTo: REGISTER_HOME_REDIRECT, plan: null };
  }

  try {
    const checkout = await deps.startPlanCheckout({ bodaId: user.boda.id, email: user.email, plan });
    if (!checkout.initPoint) throw new Error("MercadoPago no devolvió URL de checkout.");
    return { ok: true, redirectTo: checkout.initPoint, plan };
  } catch (error) {
    // Verificado igual: lo mandamos al panel de plan para reintentar el pago.
    logError("[email verification] checkout", error);
    return { ok: true, redirectTo: REGISTER_CHECKOUT_ERROR_REDIRECT, plan };
  }
}