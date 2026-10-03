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
import { getPlanLimits } from "@/lib/plans/limits";

export type AccountPlanId = "free" | "basico" | "premium";

/** Fila comparable de features (misma fila en las tres cards, incluida o no). */
export interface PlanFeatureRow {
  label: string;
  /** false = no incluido en el plan. Por defecto true. */
  included?: boolean;
  /** Aclaración corta, p. ej. "hasta 40 invitados". */
  note?: string;
}

export interface AccountPlanCard {
  id: AccountPlanId;
  label: string;
  /** Precio en ARS (0 = gratis, null = sin producto configurado → "Consultar"). */
  priceArs: number | null;
  priceLabel: string;
  priceNote?: string;
  description: string;
  features: string[];
  featureRows: PlanFeatureRow[];
  purchasable: boolean;
}

/** Plan destacado en la comparación cuando la pareja todavía puede pasarse a él. */
export const RECOMMENDED_PLAN: AccountPlanId = "basico";

const planDescriptions: Record<AccountPlanId, string> = {
  free: "Para probar DeBodas y armar lo básico.",
  basico: "Regalos e invitados sin límite.",
  premium: "La experiencia completa para tu boda.",
};

function limitLabel(value: number | null, unit: string): string {
  if (value === null) {
    return `${unit.charAt(0).toUpperCase()}${unit.slice(1)} ilimitados`;
  }
  return `Hasta ${value} ${unit}`;
}

/**
 * Filas comparables para /mi-cuenta/plan. Los números salen de getPlanLimits()
 * para que la comparación no se desfase de los límites que se aplican de verdad.
 */
export function getPlanFeatureRows(plan: AccountPlanId): PlanFeatureRow[] {
  const limits = getPlanLimits(plan);
  const photos =
    limits.maxPictures === null
      ? "Fotos ilimitadas en el álbum"
      : `Hasta ${limits.maxPictures} fotos en el álbum`;

  if (plan === "free") {
    return [
      { label: "Micrositio con tema base y cuenta regresiva" },
      { label: limitLabel(limits.maxGifts, "regalos") },
      {
        label: "Confirmación de asistencia (RSVP)",
        note:
          limits.maxRsvpGuests === null
            ? "invitados ilimitados"
            : `hasta ${limits.maxRsvpGuests} invitados`,
      },
      { label: photos },
      { label: "FAQ y galería", included: false },
      { label: "Invitaciones digitales y gestión de mesas", included: false },
      { label: "Regalo con monto libre", included: false },
    ];
  }

  if (plan === "basico") {
    return [
      { label: "Todos los temas básicos" },
      { label: limitLabel(limits.maxGifts, "regalos") },
      { label: limits.maxRsvpGuests === null ? "RSVP ilimitado" : `RSVP hasta ${limits.maxRsvpGuests} invitados` },
      { label: photos },
      { label: "FAQ, galería y medios de pago avanzados" },
      { label: "Invitaciones digitales y gestión de mesas", included: false },
      { label: "Regalo con monto libre", included: false },
    ];
  }

  return [
    { label: "Todos los temas, incluidos los premium" },
    { label: limitLabel(limits.maxGifts, "regalos") },
    { label: limits.maxRsvpGuests === null ? "RSVP ilimitado con menú especial" : `RSVP hasta ${limits.maxRsvpGuests} invitados con menú especial` },
    { label: photos },
    { label: "FAQ, galería y medios de pago avanzados" },
    { label: "Invitaciones digitales y gestión de mesas" },
    { label: "Regalo con monto libre" },
  ];
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
        priceArs: 0,
        priceLabel: "$ 0",
        priceNote: "Sin costo de alta",
        description: planDescriptions.free,
        features: planComparisonFeatures.free,
        featureRows: getPlanFeatureRows("free"),
        purchasable: false,
      };
    }

    const product = getPlanProduct(id as PurchasablePlan);
    return {
      id,
      label: planLabels[id],
      priceArs: product ? product.priceArs : null,
      priceLabel: product
        ? formatPlanPriceArs(product.priceArs)
        : "Consultar",
      priceNote: "Pago único · Sin mensualidad",
      description: planDescriptions[id],
      features: planComparisonFeatures[id],
      featureRows: getPlanFeatureRows(id),
      purchasable: true,
    };
  });
}

export function getCurrentPlanFeatures(plan: string | null | undefined): string[] {
  const normalized = normalizePlan(plan);
  return planComparisonFeatures[normalized] ?? planFeatures.free;
}
