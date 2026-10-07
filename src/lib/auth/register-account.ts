import type { PrismaClient } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import {
  buildCoupleTitle,
  buildPlanValue,
  type RegisterInput,
} from "@/lib/auth/register";
import { getPlanProduct, type PurchasablePlan } from "@/lib/plans/pricing";

/** Destino tras registrarse con el plan gratuito. */
export const REGISTER_HOME_REDIRECT = "/mi-cuenta";
/** Destino cuando la cuenta se creó pero no se pudo abrir el checkout de MercadoPago. */
export const REGISTER_CHECKOUT_ERROR_REDIRECT = "/mi-cuenta/plan?checkout=error";
/** Pantalla del código de verificación del email (paso obligatorio tras registrarse). */
export const VERIFY_EMAIL_PATH = "/registro/verificar";
/** boda.misc: plan pago elegido en el registro, pendiente hasta verificar el email. */
export const PENDING_SIGNUP_PLAN_KEY = "pending_signup_plan";

const DB_ERROR_MESSAGE =
  "No se pudo crear la cuenta. Verificá que MySQL esté activo en XAMPP.";

export interface RegisterAccountResult {
  success?: boolean;
  redirectTo?: string;
  error?: string;
}

/**
 * Dependencias inyectables: en producción las arma registerAction
 * (Prisma real, cookies de sesión, MercadoPago); en tests se reemplazan.
 */
export interface RegisterAccountDeps {
  db: PrismaClient;
  hashPassword(password: string): Promise<string>;
  generateSlug(brideName: string, groomName: string): Promise<string>;
  saveBanner(file: File, folder: string): Promise<string>;
  describeUploadError(error: unknown): string;
  createSession(user: SessionUser): Promise<void>;
  /** Genera y manda el código de verificación del email (no debe bloquear el alta si falla). */
  sendVerificationCode(input: { userId: string; email: string; name: string | null }): Promise<unknown>;
  logError?(scope: string, error: unknown): void;
}

/** Plan pago elegido en el registro (basico/premium) o null si es gratuito. */
export function resolvePaidSignupPlan(selectedPlan: string): PurchasablePlan | null {
  return getPlanProduct(buildPlanValue(selectedPlan))?.slug ?? null;
}

/**
 * Crea usuario (email SIN verificar) + boda (siempre en plan "free"), inicia sesión
 * y manda el código de verificación. Siempre redirige a la pantalla del código:
 * recién al verificar se abre el checkout de MercadoPago si eligió un plan pago
 * (queda guardado en boda.misc.pending_signup_plan) — ver confirmEmailVerification.
 */
export async function registerAccount(
  data: RegisterInput,
  bannerFile: FormDataEntryValue | null,
  deps: RegisterAccountDeps,
): Promise<RegisterAccountResult> {
  const logError =
    deps.logError ?? ((scope: string, error: unknown) => console.error(scope, error));
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
  } = data;
  const paidPlan = resolvePaidSignupPlan(selectedPlan);

  let created: { userId: string; email: string; name: string | null };

  try {
    const existingUser = await deps.db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return { error: "Ya existe una cuenta con ese email." };
    }

    const passwordHash = await deps.hashPassword(password);
    const title = buildCoupleTitle(
      brideName,
      brideLastname,
      groomName,
      groomLastname,
    );
    const slug = await deps.generateSlug(brideName, groomName);

    let bannerUrl = "";
    if (bannerFile instanceof File && bannerFile.size > 0) {
      try {
        bannerUrl = await deps.saveBanner(bannerFile, `bodas/${slug}`);
      } catch (uploadError) {
        return { error: deps.describeUploadError(uploadError) };
      }
    }

    const result = await deps.db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: title,
          role: "couple",
          // Registro público: hay que confirmar el email con el código.
          emailVerifiedAt: null,
        },
      });

      const boda = await tx.boda.create({
        data: {
          userId: createdUser.id,
          slug,
          title,
          // Los planes pagos se activan solo con el pago aprobado.
          plan: "free",
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
            ...(paidPlan ? { [PENDING_SIGNUP_PLAN_KEY]: paidPlan } : {}),
          },
        },
      });

      return { user: createdUser, bodaId: boda.id };
    });

    await deps.createSession({
      userId: result.user.id,
      email: result.user.email,
      sessionVersion: result.user.sessionVersion,
    });

    created = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
    };
  } catch (error) {
    logError("[registerAction]", error);
    return { error: DB_ERROR_MESSAGE };
  }

  try {
    await deps.sendVerificationCode(created);
  } catch (error) {
    // La cuenta ya existe: desde la pantalla del código se puede pedir otro.
    logError("[registerAction] verification code", error);
  }

  return { success: true, redirectTo: VERIFY_EMAIL_PATH };
}
