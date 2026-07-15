import {
  planFeatures,
  planLabels,
  normalizePlan,
} from "@/lib/plans/features";
import {
  formatPlanPriceArs,
  getPlanProduct,
  type PurchasablePlan,
} from "@/lib/plans/pricing";

export type AccountPlanId = "free" | "basico" | "premium";

export interface AccountPlanCard {
  id: AccountPlanId;
  label: string;
  priceLabel: string;
  priceNote?: string;
  features: string[];
  purchasable: boolean;
}

const PLAN_ORDER: AccountPlanId[] = ["free", "basico", "premium"];

const planRank: Record<AccountPlanId, number> = {
  free: 0,
  basico: 1,
  premium: 2,
};

/** Features ampliadas para comparar planes en /mi-cuenta/plan */
export const planComparisonFeatures: Record<AccountPlanId, string[]> = {
  free: [
    "Micrositio básico",
    "Tema base",
    "Countdown",
    "Hasta 10 regalos",
    "RSVP hasta 40 invitados",
  ],
  basico: [
    "Todos los temas básicos",
    "Regalos ilimitados",
    "RSVP ilimitado",
    "FAQ",
    "Álbum / galería",
    "Medios de pago avanzados",
  ],
  premium: [
    "Todos los temas",
    "Invitaciones digitales",
    "Regalo monto libre",
    "Gestión de mesas",
    "Menú especial en RSVP",
    "Todo lo del plan Básico",
  ],
};

export function getPlanRank(plan: string | null | undefined): number {
  return planRank[normalizePlan(plan)] ?? 0;
}

export function canUpgradeToPlan(
  currentPlan: string | null | undefined,
  targetPlan: AccountPlanId,
): boolean {
  return getPlanRank(targetPlan) > getPlanRank(currentPlan);
}

export function getAccountPlanCards(): AccountPlanCard[] {
  return PLAN_ORDER.map((id) => {
    if (id === "free") {
      return {
        id,
        label: planLabels.free,
        priceLabel: "$ 0",
        priceNote: "Sin costo de alta",
        features: planComparisonFeatures.free,
        purchasable: false,
      };
    }

    const product = getPlanProduct(id as PurchasablePlan);
    return {
      id,
      label: planLabels[id],
      priceLabel: product
        ? formatPlanPriceArs(product.priceArs)
        : "Consultar",
      priceNote: "Pago único · Sin mensualidad",
      features: planComparisonFeatures[id],
      purchasable: true,
    };
  });
}

export function getCurrentPlanFeatures(plan: string | null | undefined): string[] {
  const normalized = normalizePlan(plan);
  return planComparisonFeatures[normalized] ?? planFeatures.free;
}
