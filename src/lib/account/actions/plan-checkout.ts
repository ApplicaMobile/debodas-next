"use server";

import { requireOwnedBoda } from "@/lib/account/auth-boda";
import { getSession } from "@/lib/auth/session";
import { normalizePlan } from "@/lib/plans/features";
import {
  getPlanProduct,
  type PurchasablePlan,
} from "@/lib/plans/pricing";
import { MercadoPagoApiError } from "@/lib/mercadopago/api";
import { isMercadoPagoConfigured } from "@/lib/mercadopago/config";
import {
  MP_NOT_CONFIGURED_MESSAGE,
  PlanCheckoutError,
  startPlanCheckout,
} from "@/lib/payments/plan-checkout";

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

  if (!(await isMercadoPagoConfigured())) {
    return { error: MP_NOT_CONFIGURED_MESSAGE };
  }

  const planSlug = String(formData.get("plan") ?? "").trim() as PurchasablePlan;
  const product = getPlanProduct(planSlug);
  if (!product) {
    return { error: "Plan no válido." };
  }

  if (!canUpgradeTo(boda.plan, product.dbValue)) {
    return { error: "Ya tenés este plan o uno superior." };
  }

  try {
    const checkout = await startPlanCheckout({
      bodaId: boda.id,
      email: session.email,
      plan: product.slug,
    });
    return { redirectTo: checkout.initPoint };
  } catch (err) {
    console.error("[createPlanCheckoutAction]", err);
    if (err instanceof MercadoPagoApiError || err instanceof PlanCheckoutError) {
      return { error: err.message };
    }
    return { error: "No se pudo iniciar el pago con MercadoPago." };
  }
}