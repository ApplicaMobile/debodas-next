import type { PrismaClient } from "@prisma/client";
import {
  VERIFICATION_CODE_MAX_ATTEMPTS,
  VERIFICATION_CODE_RESEND_COOLDOWN_MS,
  VERIFICATION_CODE_TTL_MS,
  generateVerificationCode,
  hashVerificationCode,
  issueVerificationCode,
  normalizeVerificationCode,
  verifyVerificationCode,
  type IssueVerificationCodeResult,
  type VerifyVerificationCodeResult,
} from "@/lib/auth/verification-code";

/**
 * Código de verificación (6 dígitos) para el borrado definitivo de la cuenta.
 * Envoltorio del mecanismo genérico (`verification_codes`, purpose = account_deletion).
 */
export const DELETION_CODE_PURPOSE = "account_deletion" as const;
export const DELETION_CODE_TTL_MS = VERIFICATION_CODE_TTL_MS;
export const DELETION_CODE_MAX_ATTEMPTS = VERIFICATION_CODE_MAX_ATTEMPTS;
export const DELETION_CODE_RESEND_COOLDOWN_MS = VERIFICATION_CODE_RESEND_COOLDOWN_MS;

export type IssueDeletionCodeResult = IssueVerificationCodeResult;
export type VerifyDeletionCodeResult = VerifyVerificationCodeResult;

export const generateDeletionCode = generateVerificationCode;
export const normalizeDeletionCode = normalizeVerificationCode;

export function hashDeletionCode(secret: string, userId: string, code: string): string {
  return hashVerificationCode(secret, DELETION_CODE_PURPOSE, userId, code);
}

/** Crea (o reemplaza) el código del usuario. Devuelve el código en claro para mandarlo por email. */
export function issueDeletionCode(
  db: PrismaClient,
  input: { userId: string; secret: string; now?: Date; code?: string },
): Promise<IssueDeletionCodeResult> {
  return issueVerificationCode(db, { ...input, purpose: DELETION_CODE_PURPOSE });
}

/** Verifica y CONSUME el código (un solo uso, máximo de intentos). */
export function verifyDeletionCode(
  db: PrismaClient,
  input: { userId: string; code: string; secret: string; now?: Date },
): Promise<VerifyDeletionCodeResult> {
  return verifyVerificationCode(db, { ...input, purpose: DELETION_CODE_PURPOSE });
}

/** Código correcto y vigente -> ejecuta el borrado. Si no, no toca nada. */
export async function confirmAccountDeletion<T>(
  db: PrismaClient,
  input: { userId: string; code: string; secret: string; now?: Date },
  erase: (userId: string) => Promise<T>,
): Promise<{ ok: true; result: T } | Extract<VerifyDeletionCodeResult, { ok: false }>> {
  const verified = await verifyDeletionCode(db, input);
  if (!verified.ok) return verified;
  return { ok: true, result: await erase(input.userId) };
}