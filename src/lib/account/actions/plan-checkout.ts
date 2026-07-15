"use server";

import { requireOwnedBoda } from "@/lib/account/auth-boda";
import { getSession } from "@/lib/auth/session";
import { normalizePlan } from "@/lib/plans/features";
import {
  getPlanProduct,
  type PurchasablePlan,
} from "@/lib/plans/pricing";
import {
  createMercadoPagoPreference,
  MercadoPagoApiError,
} from "@/lib/mercadopago/api";
import {
  getAppBaseUrl,
  getMercadoPagoWebhookUrl,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago/config";
import { prisma } from "@/lib/db/prisma";

export interface PlanCheckoutState {
  error?: string;
  redirectTo?: string;
}

const planRank: Record<string, number> = {
  free: 0,
  basico: 1,
  premium: 2,
};

function canUpgradeTo(currentPlan: string, targetPlan: PurchasablePlan): boolean {
  const current = planRank[normalizePlan(currentPlan)] ?? 0;
  const target = planRank[targetPlan] ?? 0;
  return target > current;
}

export async function createPlanCheckoutAction(
  _prev: PlanCheckoutState,
  formData: FormData,
): Promise<PlanCheckoutState> {
  const session = await getSession();
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda || !session) {
    return { error: error ?? "No encontramos tu boda." };
  }

  if (!isMercadoPagoConfigured()) {
    return {
      error:
        "MercadoPago no está configurado. Agregá MERCADOPAGO_ACCESS_TOKEN en .env.local.",
    };
  }

  const planSlug = String(formData.get("plan") ?? "").trim() as PurchasablePlan;
  const product = getPlanProduct(planSlug);
  if (!product) {
    return { error: "Plan no válido." };
  }

  if (!canUpgradeTo(boda.plan, product.dbValue)) {
    return { error: "Ya tenés este plan o uno superior." };
  }

  const externalRef = `plan_${boda.id}_${Date.now()}`;

  try {
    const payment = await prisma.payment.create({
      data: {
        bodaId: boda.id,
        type: "plan",
        planTarget: product.dbValue,
        amount: product.priceArs,
        currency: "ARS",
        status: "pending",
        externalRef,
        metadata: {
          plan_slug: product.slug,
          user_email: session.email,
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
      payerEmail: session.email,
      backUrls: {
        success: `${baseUrl}/mi-cuenta/plan?payment=success`,
        failure: `${baseUrl}/mi-cuenta/plan?payment=failure`,
        pending: `${baseUrl}/mi-cuenta/plan?payment=pending`,
      },
      notificationUrl: getMercadoPagoWebhookUrl(boda.id),
      metadata: {
        payment_id: payment.id,
        boda_id: boda.id,
        type: "plan",
        plan_target: product.dbValue,
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { mpPreferenceId: preference.id },
    });

    return { redirectTo: preference.initPoint };
  } catch (err) {
    console.error("[createPlanCheckoutAction]", err);
    if (err instanceof MercadoPagoApiError) {
      return { error: err.message };
    }
    return { error: "No se pudo iniciar el pago con MercadoPago." };
  }
}
