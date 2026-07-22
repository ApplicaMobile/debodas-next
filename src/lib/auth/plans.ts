import {
  formatPlanPriceArs,
  getPlanProduct,
} from "@/lib/plans/pricing";

function pricedLabel(slug: "basico" | "premium"): string {
  const product = getPlanProduct(slug);
  return product ? formatPlanPriceArs(product.priceArs) : "$0";
}

export const REGISTER_PLANS = [
  {
    slug: "gratuito",
    dbValue: "free",
    name: "Gratuito",
    price: "$0",
    description: "Micrositio básico para empezar.",
  },
  {
    slug: "basico",
    dbValue: "basico",
    name: "Básico",
    price: pricedLabel("basico"),
    description: "Más regalos, temas y medios de pago.",
  },
  {
    slug: "premium",
    dbValue: "premium",
    name: "Premium",
    price: pricedLabel("premium"),
    description: "Experiencia completa con todos los temas.",
  },
] as const;

export type RegisterPlanSlug = (typeof REGISTER_PLANS)[number]["slug"];

const PLAN_DB_VALUES = new Set<string>(
  REGISTER_PLANS.map((plan) => plan.dbValue),
);

export function normalizeRegisterPlan(value: string): string {
  const plan = REGISTER_PLANS.find((item) => item.slug === value);
  if (plan) {
    return plan.dbValue;
  }

  if (PLAN_DB_VALUES.has(value)) {
    return value;
  }

  return "free";
}

export function isValidRegisterPlanSlug(value: string): boolean {
  return REGISTER_PLANS.some((plan) => plan.slug === value);
}
