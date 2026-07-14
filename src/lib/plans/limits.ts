import { normalizePlan } from "@/lib/plans/features";

export interface PlanLimits {
  maxGifts: number | null;
  maxRsvpGuests: number | null;
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  const normalized = normalizePlan(plan);

  if (normalized === "free") {
    return { maxGifts: 10, maxRsvpGuests: 40 };
  }

  return { maxGifts: null, maxRsvpGuests: null };
}

export function formatPlanLimit(value: number | null): string {
  if (value === null) {
    return "Ilimitado";
  }
  return String(value);
}

export function canAddGift(
  plan: string | null | undefined,
  currentCount: number,
): boolean {
  const { maxGifts } = getPlanLimits(plan);
  if (maxGifts === null) {
    return true;
  }
  return currentCount < maxGifts;
}

export function canAddRsvpGuest(
  plan: string | null | undefined,
  currentCount: number,
): boolean {
  const { maxRsvpGuests } = getPlanLimits(plan);
  if (maxRsvpGuests === null) {
    return true;
  }
  return currentCount < maxRsvpGuests;
}

export function giftLimitMessage(plan: string | null | undefined): string {
  const { maxGifts } = getPlanLimits(plan);
  if (maxGifts === null) {
    return "";
  }
  return `Tu plan permite hasta ${maxGifts} regalos.`;
}

export function rsvpLimitMessage(plan: string | null | undefined): string {
  const { maxRsvpGuests } = getPlanLimits(plan);
  if (maxRsvpGuests === null) {
    return "";
  }
  return `Tu plan permite hasta ${maxRsvpGuests} invitados en RSVP.`;
}

export function giftLimitError(plan: string | null | undefined): string {
  const { maxGifts } = getPlanLimits(plan);
  if (maxGifts === null) {
    return "No se pudo agregar el regalo.";
  }
  return `Alcanzaste el límite de ${maxGifts} regalos de tu plan.`;
}

export function rsvpLimitError(plan: string | null | undefined): string {
  const { maxRsvpGuests } = getPlanLimits(plan);
  if (maxRsvpGuests === null) {
    return "No se pudo registrar la confirmación.";
  }
  return `Se alcanzó el límite de ${maxRsvpGuests} invitados para esta boda.`;
}
