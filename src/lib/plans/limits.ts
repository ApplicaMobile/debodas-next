import { normalizePlan } from "@/lib/plans/features";

export interface PlanLimits {
  maxGifts: number | null;
  maxRsvpGuests: number | null;
  maxPictures: number | null;
  maxCustomGifts: number | null;
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  const normalized = normalizePlan(plan);

  if (normalized === "free") {
    return {
      maxGifts: 10,
      maxRsvpGuests: 40,
      maxPictures: 3,
      maxCustomGifts: 10,
    };
  }
  if (normalized === "basico") {
    return {
      maxGifts: null,
      maxRsvpGuests: null,
      maxPictures: 4,
      maxCustomGifts: null,
    };
  }

  return {
    maxGifts: null,
    maxRsvpGuests: null,
    maxPictures: null,
    maxCustomGifts: null,
  };
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

export function canAddPicture(
  plan: string | null | undefined,
  currentCount: number,
): boolean {
  const { maxPictures } = getPlanLimits(plan);
  if (maxPictures === null) {
    return true;
  }
  return currentCount < maxPictures;
}

export function pictureLimitMessage(plan: string | null | undefined): string {
  const { maxPictures } = getPlanLimits(plan);
  if (maxPictures === null) {
    return "";
  }
  return `Tu plan permite hasta ${maxPictures} fotos en el álbum.`;
}

export function pictureLimitError(plan: string | null | undefined): string {
  const { maxPictures } = getPlanLimits(plan);
  if (maxPictures === null) {
    return "No se pudo agregar la foto.";
  }
  return `Alcanzaste el límite de ${maxPictures} fotos de tu plan.`;
}

export function canAddCustomGift(
  plan: string | null | undefined,
  currentCount: number,
): boolean {
  const { maxCustomGifts, maxGifts } = getPlanLimits(plan);
  const cap = maxCustomGifts ?? maxGifts;
  if (cap === null) {
    return true;
  }
  return currentCount < cap;
}
