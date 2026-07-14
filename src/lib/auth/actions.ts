"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { verifyCredentials } from "@/lib/auth/credentials";
import {
  buildCoupleTitle,
  buildPlanValue,
  validateRegisterInput,
} from "@/lib/auth/register";
import { generateUniqueSlug } from "@/lib/auth/slug";
import { createSession, deleteSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
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
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/mi-cuenta");

  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/mi-cuenta";

  try {
    const user = await verifyCredentials(email, password);
    if (!user) {
      return { error: "Email o contraseña incorrectos." };
    }

    await createSession({ userId: user.id, email: user.email });

    return { success: true, redirectTo: safeNext };
  } catch (error) {
    console.error("[loginAction]", error);
    return {
      error:
        "No se pudo conectar con la base de datos. Verificá que MySQL esté activo en XAMPP.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const validation = validateRegisterInput(formData);
  if (!validation.ok) {
    return { error: validation.error };
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

    await createSession({ userId: user.id, email: user.email });

    return { success: true, redirectTo: "/mi-cuenta" };
  } catch (error) {
    console.error("[registerAction]", error);
    return {
      error:
        "No se pudo crear la cuenta. Verificá que MySQL esté activo en XAMPP.",
    };
  }
}
