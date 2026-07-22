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
import {
  buildCoupleTitle,
  buildPlanValue,
  validateRegisterInput,
} from "@/lib/auth/register";
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
    return { error: "Email o contraseña incorrectos." };
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
      };
    }

    const user = await verifyCredentials(normalizedEmail, password);
    if (!user) {
      return { error: "Email o contraseña incorrectos." };
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

    let redirectTo = safeNext;
    if (safeNext.startsWith("/admin") && !isAdminRole(user.role)) {
      redirectTo = "/acceso-denegado?from=admin";
    } else if (
      isAdminRole(user.role) &&
      (safeNext === "/mi-cuenta" || safeNext.startsWith("/mi-cuenta"))
    ) {
      redirectTo = "/admin";
    }

    return { success: true, redirectTo };
  } catch (error) {
    console.error("[loginAction]", error);
    return {
      error:
        "No se pudo conectar con la base de datos. Verificá que MySQL esté activo en XAMPP.",
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

  const {
    email,
    password,
    brideName,
    brideLastname,
    groomName,
    groomLastname,
    phone,
    eventDate,
    ourStory,
    siteSource,
    siteSourceOther,
    selectedPlan,
  } = validation.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return { error: "Ya existe una cuenta con ese email." };
    }

    const passwordHash = await hash(password, 10);
    const title = buildCoupleTitle(
      brideName,
      brideLastname,
      groomName,
      groomLastname,
    );
    const slug = await generateUniqueSlug(brideName, groomName);
    const plan = buildPlanValue(selectedPlan);
    const bannerFile = formData.get("banner_file");

    let bannerUrl = "";
    if (bannerFile instanceof File && bannerFile.size > 0) {
      try {
        bannerUrl = await saveUploadedImage(bannerFile, `bodas/${slug}`);
      } catch (uploadError) {
        return { error: getUploadErrorMessage(uploadError) };
      }
    }

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: title,
          role: "couple",
        },
      });

      await tx.boda.create({
        data: {
          userId: createdUser.id,
          slug,
          title,
          plan,
          micrositeTheme: "base",
          couple: {
            bride_name: brideName,
            bride_lastname: brideLastname,
            groom_name: groomName,
            groom_lastname: groomLastname,
            phone,
          },
          event: {
            date: eventDate,
            time: "",
            place: "",
          },
          banner: bannerUrl
            ? {
                image: { url: bannerUrl },
              }
            : {},
          featuredImageUrl: bannerUrl || null,
          options: {
            show_faq: 1,
            show_dress_code: 0,
          },
          misc: {
            our_story: ourStory,
            spotify_url: "",
            site_source: siteSource,
            site_source_other:
              siteSource === "other" ? siteSourceOther : "",
          },
        },
      });

      return createdUser;
    });

    await createSession({
      userId: user.id,
      email: user.email,
      sessionVersion: user.sessionVersion,
    });

    return { success: true, redirectTo: "/mi-cuenta" };
  } catch (error) {
    console.error("[registerAction]", error);
    return {
      error:
        "No se pudo crear la cuenta. Verificá que MySQL esté activo en XAMPP.",
    };
  }
}
