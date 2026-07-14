export type PurchasablePlan = "basico" | "premium";

export interface PlanProduct {
  slug: PurchasablePlan;
  dbValue: PurchasablePlan;
  name: string;
  description: string;
  priceArs: number;
}

function readPlanPrice(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const PLAN_PRODUCTS: PlanProduct[] = [
  {
    slug: "basico",
    dbValue: "basico",
    name: "Plan Básico",
    description: "Temas premium, regalos e invitados ilimitados.",
    priceArs: readPlanPrice("PLAN_BASICO_PRICE_ARS", 50000),
  },
  {
    slug: "premium",
    dbValue: "premium",
    name: "Plan Premium",
    description: "Experiencia completa con todos los temas y funciones.",
    priceArs: readPlanPrice("PLAN_PREMIUM_PRICE_ARS", 90000),
  },
];

export function getPlanProduct(slug: string): PlanProduct | null {
  return PLAN_PRODUCTS.find((product) => product.slug === slug) ?? null;
}

export function formatPlanPriceArs(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}
