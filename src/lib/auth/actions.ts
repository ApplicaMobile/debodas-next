"use server";

import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAdminAuditContext,
  writeAdminAudit,
} from "@/lib/admin/audit";
import { verifyCredentials } from "@/lib/auth/credentials";
import { isAdminRole } from "@/lib/auth/roles";
import { validateRegisterInput } from "@/lib/auth/register";
import { registerAccount, VERIFY_EMAIL_PATH } from "@/lib/auth/register-account";
import { sendEmailVerificationCodeTo } from "@/lib/auth/email-verification-server";
import { loginOutcomeForStatus } from "@/lib/account/status";
import { generateUniqueSlug } from "@/lib/auth/slug";
import { createSession, deleteSession, getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/security/rate-limit";
import {
  getUploadErrorMessage,
  saveUploadedImage,
} from "@/lib/upload/local";

export interface LoginState {
  error?: string;
  errorCode?: "invalid" | "too_many" | "db" | "suspended";
  retryAfter?: number;
  success?: boolean;
  redirectTo?: string;
}

export type RegisterState = LoginState;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const normalizedEmail = email.trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/mi-cuenta");
  const website = String(formData.get("website") ?? "").trim();

  if (website || normalizedEmail.length > 254 || password.length > 72) {
    return { error: "Email o contraseña incorrectos.", errorCode: "invalid" };
  }

  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/mi-cuenta";

  try {
    const headerStore = await headers();
    const ip = clientIpFromHeaders(headerStore);
    const [ipLimit, accountLimit] = await Promise.all([
      checkRateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000),
      checkRateLimit(`login:account:${normalizedEmail}`, 10, 15 * 60 * 1000),
    ]);
    const limited = !ipLimit.ok ? ipLimit : accountLimit;
    if (!limited.ok) {
      return {
        error: `Demasiados intentos. Probá en ${limited.retryAfterSec}s.`,
        errorCode: "too_many",
        retryAfter: limited.retryAfterSec,
      };
    }

    const user = await verifyCredentials(normalizedEmail, password);
    if (!user) {
      return { error: "Email o contraseña incorrectos.", errorCode: "invalid" };
    }

    const outcome = loginOutcomeForStatus(user.status);
    if (outcome === "suspended") {
      return {
        error: "Tu cuenta está suspendida. Escribinos a hola@debodas.com.ar.",
        errorCode: "suspended",
      };
    }
    if (outcome === "invalid") {
      return { error: "Email o contraseña incorrectos.", errorCode: "invalid" };
    }

    await createSession({
      userId: user.id,
      email: user.email,
      sessionVersion: user.sessionVersion,
    });

    if (isAdminRole(user.role)) {
      const audit = await getAdminAuditContext({
        id: user.id,
        email: user.email,
      });
      await prisma.$transaction((tx) =>
        writeAdminAudit(tx, audit, {
          action: "admin.auth.login",
          entity: "auth",
          entityId: user.id,
          metadata: { next: safeNext },
        }),
      );
    }

    // Registro sin verificar: primero el código (se manda uno nuevo si no hay cooldown).
    if (!user.emailVerifiedAt && !isAdminRole(user.role)) {
      try {
        await sendEmailVerificationCodeTo({ userId: user.id, email: user.email, name: user.name });
      } catch (error) {
        console.error("[loginAction] verification code", error);
      }
      return { success: true, redirectTo: VERIFY_EMAIL_PATH };
    }

    let redirectTo = safeNext;
    if (safeNext.startsWith("/admin") && !isAdminRole(user.role)) {
      redirectTo = "/acceso-denegado?from=admin";
    } else if (
      isAdminRole(user.role) &&
      (safeNext === "/mi-cuenta" ||
        safeNext.startsWith("/mi-cuenta") ||
        safeNext === "/")
    ) {
      redirectTo = "/";
    }

    return { success: true, redirectTo };
  } catch (error) {
    console.error("[loginAction]", error);
    return {
      error:
        "No se pudo conectar con la base de datos. Verificá que MySQL esté activo.",
      errorCode: "db",
    };
  }
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, role: true },
    });
    if (user && isAdminRole(user.role)) {
      const audit = await getAdminAuditContext(user);
      await prisma.$transaction((tx) =>
        writeAdminAudit(tx, audit, {
          action: "admin.auth.logout",
          entity: "auth",
          entityId: user.id,
        }),
      );
    }
  }

  await deleteSession();
  redirect("/login");
}

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  if (String(formData.get("website") ?? "").trim()) {
    return { success: true, redirectTo: "/" };
  }

  const validation = validateRegisterInput(formData);
  if (!validation.ok) {
    return { error: validation.error };
  }

  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000),
    checkRateLimit(
      `register:email:${validation.data.email}`,
      3,
      60 * 60 * 1000,
    ),
  ]);
  const limited = !ipLimit.ok ? ipLimit : emailLimit;
  if (!limited.ok) {
    return {
      error: `Demasiados registros desde esta red. Probá en ${limited.retryAfterSec}s.`,
    };
  }

  return registerAccount(validation.data, formData.get("banner_file"), {
    db: prisma,
    hashPassword: (password) => hash(password, 10),
    generateSlug: generateUniqueSlug,
    saveBanner: saveUploadedImage,
    describeUploadError: getUploadErrorMessage,
    createSession,
    sendVerificationCode: sendEmailVerificationCodeTo,
  });
}
