import type { ThemePlan } from "@/lib/themes/types";

const planRank: Record<string, number> = {
  free: 0,
  "sin-plan": 0,
  basico: 1,
  premium: 2,
};

export function normalizePlan(plan: string | null | undefined): ThemePlan | "free" {
  if (plan === "basico" || plan === "premium" || plan === "free") {
    return plan;
  }
  return "free";
}

export function canUseTheme(
  userPlan: string | null | undefined,
  themePlan: ThemePlan,
): boolean {
  const userRank = planRank[normalizePlan(userPlan)] ?? 0;
  const themeRank = planRank[themePlan] ?? 0;
  return userRank >= themeRank;
}

export const planLabels: Record<string, string> = {
  free: "Free",
  "sin-plan": "Free",
  basico: "Básico",
  premium: "Premium",
};

export const planFeatures: Record<string, string[]> = {
  free: ["Micrositio básico", "Tema base", "Countdown"],
  basico: [
    "Todos los temas básicos",
    "Lista de regalos",
    "RSVP",
    "FAQ",
    "Tipografías básicas",
  ],
  premium: [
    "Todos los temas",
    "Invitaciones digitales",
    "Playlist de Spotify",
    "Tipografías premium",
    "Regalo monto libre",
    "Gestión de mesas",
    "Menú especial en RSVP",
  ],
};
