"use server";

import { requireOwnedBoda } from "@/lib/account/auth-boda";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import type { AccountPlanId } from "@/lib/plans/comparison";
import { isDemoPlanSwitchEnabled } from "@/lib/plans/demo";
import { prisma } from "@/lib/db/prisma";

export interface DemoPlanState {
  error?: string;
  success?: string;
}

const ALLOWED_PLANS = new Set<AccountPlanId>(["free", "basico", "premium"]);

export async function setDemoPlanAction(
  _prev: DemoPlanState,
  formData: FormData,
): Promise<DemoPlanState> {
  if (!isDemoPlanSwitchEnabled()) {
    return {
      error:
        "El cambio de plan demo solo está disponible en desarrollo o con ALLOW_DEMO_PLAN_SWITCH=true.",
    };
  }

  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const plan = String(formData.get("plan") ?? "").trim() as AccountPlanId;
  if (!ALLOWED_PLANS.has(plan)) {
    return { error: "Plan no válido." };
  }

  try {
    await prisma.boda.update({
      where: { id: boda.id },
      data: { plan },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/plan"]);

    return { success: `Plan actualizado a ${plan} (modo demo).` };
  } catch (err) {
    console.error("[setDemoPlanAction]", err);
    return { error: "No se pudo actualizar el plan." };
  }
}
