import { prisma } from "@/lib/db/prisma";
import { isAccountActive } from "@/lib/account/status";
import { createMercadoPagoPreference } from "@/lib/mercadopago/api";
import {
  getAppBaseUrl,
  getMercadoPagoWebhookUrl,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago/config";
import { getPlanProduct, type PurchasablePlan } from "@/lib/plans/pricing";

export interface StartPlanCheckoutInput {
  bodaId: string;
  email: string;
  plan: PurchasablePlan | string;
}

export interface StartPlanCheckoutResult {
  paymentId: string;
  preferenceId: string;
  initPoint: string;
}

/** Error de negocio previo a hablar con MercadoPago (plan inválido, MP sin configurar). */
export class PlanCheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanCheckoutError";
  }
}

export const MP_NOT_CONFIGURED_MESSAGE =
  "MercadoPago no está configurado. El administrador debe cargarlo en /admin/mercadopago.";

/**
 * Crea el Payment local (pending) y la preferencia de MercadoPago para un plan pago.
 * Devuelve la URL de checkout (init_point o sandbox_init_point según el modo).
 * No valida dueño ni upgrade: eso lo hace quien llama.
 * Lanza PlanCheckoutError o MercadoPagoApiError si algo falla.
 */
export async function startPlanCheckout(
  input: StartPlanCheckoutInput,
): Promise<StartPlanCheckoutResult> {
  const product = getPlanProduct(String(input.plan ?? "").trim());
  if (!product) {
    throw new PlanCheckoutError("Plan no válido.");
  }

  if (!(await isMercadoPagoConfigured())) {
    throw new PlanCheckoutError(MP_NOT_CONFIGURED_MESSAGE);
  }

  const owner = await prisma.boda.findUnique({
    where: { id: input.bodaId },
    select: { user: { select: { status: true, emailVerifiedAt: true } } },
  });
  if (!owner || !isAccountActive(owner.user?.status)) {
    throw new PlanCheckoutError("La cuenta no está activa.");
  }
  if (!owner.user?.emailVerifiedAt) {
    throw new PlanCheckoutError("Verificá tu email antes de pagar un plan.");
  }

  const externalRef = `plan_${input.bodaId}_${Date.now()}`;

  const payment = await prisma.payment.create({
    data: {
      bodaId: input.bodaId,
      type: "plan",
      planTarget: product.dbValue,
      amount: product.priceArs,
      currency: "ARS",
      status: "pending",
      externalRef,
      metadata: {
        plan_slug: product.slug,
        user_email: input.email,
      },
    },
  });

  const baseUrl = getAppBaseUrl();
  const preference = await createMercadoPagoPreference({
    externalReference: payment.externalRef,
    items: [
      {
        title: `${product.name} · DeBodas`,
        quantity: 1,
        unit_price: product.priceArs,
      },
    ],
    payerEmail: input.email,
    backUrls: {
      success: `${baseUrl}/mi-cuenta/plan?payment=success`,
      failure: `${baseUrl}/mi-cuenta/plan?payment=failure`,
      pending: `${baseUrl}/mi-cuenta/plan?payment=pending`,
    },
    notificationUrl: getMercadoPagoWebhookUrl(input.bodaId),
    metadata: {
      payment_id: payment.id,
      boda_id: input.bodaId,
      type: "plan",
      plan_target: product.dbValue,
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { mpPreferenceId: preference.id },
  });

  return {
    paymentId: payment.id,
    preferenceId: preference.id,
    initPoint: preference.initPoint,
  };
}