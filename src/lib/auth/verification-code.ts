import { createHmac, randomInt, timingSafeEqual } from "crypto";
import type { PrismaClient } from "@prisma/client";

/**
 * Códigos de un solo uso (6 dígitos) enviados por email, genéricos por propósito
 * (verificación del registro, borrado de cuenta…). Tabla `verification_codes`.
 * Solo se guarda un HMAC (secreto + propósito + userId + código), nunca el código.
 * Un código vigente por usuario y propósito; pedir otro reemplaza al anterior (con cooldown).
 */
export const VERIFICATION_CODE_PURPOSES = ["email_verification", "account_deletion"] as const;
export type VerificationCodePurpose = (typeof VERIFICATION_CODE_PURPOSES)[number];

export const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
export const VERIFICATION_CODE_MAX_ATTEMPTS = 5;
export const VERIFICATION_CODE_RESEND_COOLDOWN_MS = 60 * 1000;

export type IssueVerificationCodeResult =
  | { ok: true; code: string; expiresAt: Date; resendAvailableAt: Date }
  | { ok: false; error: "cooldown"; retryAfterSec: number };

export type VerifyVerificationCodeResult =
  | { ok: true }
  | {
      ok: false;
      error: "missing" | "expired" | "too_many" | "invalid" | "format";
      attemptsLeft?: number;
    };

export interface CodeTarget {
  userId: string;
  purpose: VerificationCodePurpose;
}

/** Prefijos del HMAC: el de borrado conserva el valor histórico. */
const HASH_SCOPE: Record<VerificationCodePurpose, string> = {
  account_deletion: "account-deletion",
  email_verification: "email-verification",
};

export function generateVerificationCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function normalizeVerificationCode(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function hashVerificationCode(
  secret: string,
  purpose: VerificationCodePurpose,
  userId: string,
  code: string,
): string {
  return createHmac("sha256", secret).update(`${HASH_SCOPE[purpose]}:${userId}:${code}`).digest("hex");
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

const whereTarget = (t: CodeTarget) => ({ userId_purpose: { userId: t.userId, purpose: t.purpose } });

/** Código vigente (para retomar la pantalla del código o calcular el cooldown). */
export async function findPendingVerificationCode(
  db: PrismaClient,
  target: CodeTarget & { now?: Date },
): Promise<{ expiresAt: Date; sentAt: Date; resendAvailableAt: Date } | null> {
  const now = target.now ?? new Date();
  const record = await db.verificationCode.findUnique({
    where: whereTarget(target),
    select: { expiresAt: true, sentAt: true },
  });
  if (!record || record.expiresAt.getTime() <= now.getTime()) return null;
  return {
    expiresAt: record.expiresAt,
    sentAt: record.sentAt,
    resendAvailableAt: new Date(record.sentAt.getTime() + VERIFICATION_CODE_RESEND_COOLDOWN_MS),
  };
}

/** Crea (o reemplaza) el código. Devuelve el código en claro para mandarlo por email. */
export async function issueVerificationCode(
  db: PrismaClient,
  input: CodeTarget & { secret: string; now?: Date; code?: string },
): Promise<IssueVerificationCodeResult> {
  const now = input.now ?? new Date();
  const existing = await db.verificationCode.findUnique({
    where: whereTarget(input),
    select: { sentAt: true },
  });
  if (existing) {
    const wait = existing.sentAt.getTime() + VERIFICATION_CODE_RESEND_COOLDOWN_MS - now.getTime();
    if (wait > 0) {
      return { ok: false, error: "cooldown", retryAfterSec: Math.ceil(wait / 1000) };
    }
  }

  const code = input.code ?? generateVerificationCode();
  const expiresAt = new Date(now.getTime() + VERIFICATION_CODE_TTL_MS);
  const data = {
    codeHash: hashVerificationCode(input.secret, input.purpose, input.userId, code),
    attempts: 0,
    expiresAt,
    sentAt: now,
  };
  await db.verificationCode.upsert({
    where: whereTarget(input),
    create: { userId: input.userId, purpose: input.purpose, ...data },
    update: data,
  });
  return {
    ok: true,
    code,
    expiresAt,
    resendAvailableAt: new Date(now.getTime() + VERIFICATION_CODE_RESEND_COOLDOWN_MS),
  };
}

/** Borra el código (p. ej. si no se pudo mandar el email, para no bloquear el reintento). */
export async function discardVerificationCode(db: PrismaClient, target: CodeTarget): Promise<void> {
  await db.verificationCode.deleteMany({ where: { userId: target.userId, purpose: target.purpose } });
}

/**
 * Verifica y CONSUME el código (un solo uso). Cada intento fallido suma;
 * al llegar al máximo el código queda inutilizable aunque después se acierte.
 */
export async function verifyVerificationCode(
  db: PrismaClient,
  input: CodeTarget & { code: string; secret: string; now?: Date },
): Promise<VerifyVerificationCodeResult> {
  const now = input.now ?? new Date();
  const code = normalizeVerificationCode(input.code);
  const record = await db.verificationCode.findUnique({ where: whereTarget(input) });
  if (!record) return { ok: false, error: "missing" };
  if (record.expiresAt.getTime() <= now.getTime()) return { ok: false, error: "expired" };
  if (record.attempts >= VERIFICATION_CODE_MAX_ATTEMPTS) return { ok: false, error: "too_many" };
  if (code.length !== 6) return { ok: false, error: "format" };

  if (!sameHash(record.codeHash, hashVerificationCode(input.secret, input.purpose, input.userId, code))) {
    const updated = await db.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    const attemptsLeft = Math.max(0, VERIFICATION_CODE_MAX_ATTEMPTS - updated.attempts);
    return attemptsLeft === 0
      ? { ok: false, error: "too_many", attemptsLeft }
      : { ok: false, error: "invalid", attemptsLeft };
  }

  // Un solo uso: si otro request lo consumió primero, count = 0.
  const consumed = await db.verificationCode.deleteMany({
    where: { id: record.id, attempts: record.attempts },
  });
  return consumed.count === 1 ? { ok: true } : { ok: false, error: "missing" };
}