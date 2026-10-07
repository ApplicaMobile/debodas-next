"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";
import { eraseAccount } from "@/lib/account/delete-account";
import {
  DELETION_CODE_PURPOSE,
  DELETION_CODE_TTL_MS,
  confirmAccountDeletion,
  issueDeletionCode,
} from "@/lib/account/deletion-code";
import { discardVerificationCode } from "@/lib/auth/verification-code";
import { isAccountActive } from "@/lib/account/status";
import { getAuthSecret } from "@/lib/auth/constants";
import { checkUserPassword } from "@/lib/auth/legacy-password";
import { isAdminRole } from "@/lib/auth/roles";
import { deleteSession, getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { accountDeletionCodeEmail } from "@/lib/email/account-deletion-template";
import { enqueueEmail } from "@/lib/email/queue";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/security/rate-limit";
import { deleteLocalUpload, deleteUploadFolder } from "@/lib/upload/local";

export interface AccountDeletionState {
  step: "form" | "code";
  error?: string;
  info?: string;
  /** epoch ms: cuándo se puede pedir otro código. */
  resendAvailableAt?: number;
}

const CONFIRM_WORD = "ELIMINAR";
const HOUR_MS = 60 * 60 * 1000;

function deletionSecret(): string {
  return new TextDecoder().decode(getAuthSecret());
}

async function loadCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      passwordHash: true,
      legacyPasswordHash: true,
    },
  });
  if (!user || !isAccountActive(user.status)) return null;
  return user;
}

async function limited(keys: Array<[string, number, number]>): Promise<number | null> {
  const results = await Promise.all(keys.map(([key, max, win]) => checkRateLimit(key, max, win)));
  const hit = results.find((r) => !r.ok);
  return hit && !hit.ok ? hit.retryAfterSec : null;
}

/** Genera y envía el código. Devuelve el estado para la UI. */
async function sendDeletionCode(
  user: { id: string; email: string },
  resend: boolean,
): Promise<AccountDeletionState> {
  const { locale, messages } = await getDictionary();
  const issued = await issueDeletionCode(prisma, { userId: user.id, secret: deletionSecret() });
  if (!issued.ok) {
    return {
      step: "code",
      error: t(messages, "accountDeletion.errorCooldown", { seconds: issued.retryAfterSec }),
      resendAvailableAt: Date.now() + issued.retryAfterSec * 1000,
    };
  }

  const minutes = Math.round(DELETION_CODE_TTL_MS / 60000);
  const email = accountDeletionCodeEmail({ locale, code: issued.code, minutes });
  try {
    const queued = await enqueueEmail({
      to: user.email,
      subject: email.subject,
      html: email.html,
      type: "account_deletion_code",
      dedupeKey: `account-deletion-code:${user.id}:${issued.expiresAt.getTime()}`,
      meta: { userId: user.id },
    });
    if (queued.skipped) throw new Error("email skipped");
  } catch (error) {
    console.error("[account deletion] no se pudo encolar el código", error);
    // Sin email no hay forma de confirmar: liberamos el cooldown para reintentar.
    await discardVerificationCode(prisma, { userId: user.id, purpose: DELETION_CODE_PURPOSE });
    return { step: resend ? "code" : "form", error: t(messages, "accountDeletion.errorEmail") };
  }

  return {
    step: "code",
    info: resend
      ? t(messages, "accountDeletion.codeResent")
      : t(messages, "accountDeletion.codeSent", { email: user.email, minutes }),
    resendAvailableAt: issued.resendAvailableAt.getTime(),
  };
}

async function requestCode(formData: FormData): Promise<AccountDeletionState> {
  const { messages } = await getDictionary();
  const user = await loadCurrentUser();
  if (!user) return { step: "form", error: t(messages, "accountDeletion.errorGeneric") };
  if (isAdminRole(user.role)) return { step: "form", error: t(messages, "accountDeletion.errorAdmin") };

  if (formData.get("understand") !== "on") {
    return { step: "form", error: t(messages, "accountDeletion.errorCheckbox") };
  }
  if (String(formData.get("confirm_word") ?? "").trim() !== CONFIRM_WORD) {
    return { step: "form", error: t(messages, "accountDeletion.errorConfirmWord") };
  }

  const ip = clientIpFromHeaders(await headers());
  const wait = await limited([
    [`account-delete:request:user:${user.id}`, 5, HOUR_MS],
    [`account-delete:request:ip:${ip}`, 20, HOUR_MS],
  ]);
  if (wait !== null) {
    return { step: "form", error: t(messages, "accountDeletion.errorTooMany", { seconds: wait }) };
  }

  const password = String(formData.get("password") ?? "");
  const check = await checkUserPassword(prisma, user, password);
  if (!check.ok) return { step: "form", error: t(messages, "accountDeletion.errorPassword") };

  return sendDeletionCode(user, false);
}

async function resendCode(): Promise<AccountDeletionState> {
  const { messages } = await getDictionary();
  const user = await loadCurrentUser();
  if (!user) return { step: "form", error: t(messages, "accountDeletion.errorGeneric") };
  if (isAdminRole(user.role)) return { step: "form", error: t(messages, "accountDeletion.errorAdmin") };

  const pending = await prisma.verificationCode.findUnique({
    where: { userId_purpose: { userId: user.id, purpose: DELETION_CODE_PURPOSE } },
    select: { id: true },
  });
  if (!pending) return { step: "form", error: t(messages, "accountDeletion.errorCodeMissing") };

  const wait = await limited([[`account-delete:request:user:${user.id}`, 5, HOUR_MS]]);
  if (wait !== null) {
    return { step: "code", error: t(messages, "accountDeletion.errorTooMany", { seconds: wait }) };
  }
  return sendDeletionCode(user, true);
}

async function confirmCode(formData: FormData): Promise<AccountDeletionState> {
  const { messages } = await getDictionary();
  const user = await loadCurrentUser();
  if (!user) return { step: "form", error: t(messages, "accountDeletion.errorGeneric") };
  if (isAdminRole(user.role)) return { step: "form", error: t(messages, "accountDeletion.errorAdmin") };

  const ip = clientIpFromHeaders(await headers());
  const wait = await limited([
    [`account-delete:confirm:user:${user.id}`, 10, 15 * 60 * 1000],
    [`account-delete:confirm:ip:${ip}`, 30, 15 * 60 * 1000],
  ]);
  if (wait !== null) {
    return { step: "code", error: t(messages, "accountDeletion.errorTooMany", { seconds: wait }) };
  }

  const outcome = await confirmAccountDeletion(
    prisma,
    { userId: user.id, code: String(formData.get("code") ?? ""), secret: deletionSecret() },
    (userId) =>
      eraseAccount(
        prisma,
        { userId },
        {
          deleteFile: deleteLocalUpload,
          deleteFolder: deleteUploadFolder,
          logError: (scope, error) => console.error(`[account erase] ${scope}`, error),
        },
      ),
  );

  if (!outcome.ok) {
    switch (outcome.error) {
      case "invalid":
        return {
          step: "code",
          error: t(messages, "accountDeletion.errorCodeInvalid", { attempts: outcome.attemptsLeft ?? 0 }),
        };
      case "format":
        return { step: "code", error: t(messages, "accountDeletion.errorCodeFormat") };
      case "expired":
        return { step: "code", error: t(messages, "accountDeletion.errorCodeExpired") };
      case "too_many":
        return { step: "code", error: t(messages, "accountDeletion.errorCodeTooMany") };
      default:
        return { step: "form", error: t(messages, "accountDeletion.errorCodeMissing") };
    }
  }
  if (!outcome.result.ok) {
    return { step: "form", error: t(messages, "accountDeletion.errorGeneric") };
  }

  await deleteSession();
  redirect("/?cuenta=eliminada");
}

/** Única acción del panel (useActionState): intent = request | resend | confirm. */
export async function accountDeletionAction(
  _prev: AccountDeletionState,
  formData: FormData,
): Promise<AccountDeletionState> {
  const intent = String(formData.get("intent") ?? "request");
  if (intent === "confirm") return confirmCode(formData);
  if (intent === "resend") return resendCode();
  return requestCode(formData);
}