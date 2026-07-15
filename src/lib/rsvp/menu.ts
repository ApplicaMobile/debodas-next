import { normalizePlan } from "@/lib/plans/features";

export const RSVP_MENU_OPTIONS = [
  { value: "general", label: "Menú general" },
  { value: "celiaco", label: "Celíaco" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
] as const;

export type RsvpMenuValue = (typeof RSVP_MENU_OPTIONS)[number]["value"];

const MENU_VALUES = new Set<string>(
  RSVP_MENU_OPTIONS.map((option) => option.value),
);

export function isRsvpMenuValue(value: string): value is RsvpMenuValue {
  return MENU_VALUES.has(value);
}

export function sanitizeRsvpMenu(value: string | null | undefined): RsvpMenuValue {
  if (value && isRsvpMenuValue(value)) {
    return value;
  }
  return "general";
}

export function rsvpMenuLabel(value: string | null | undefined): string {
  const menu = sanitizeRsvpMenu(value);
  return (
    RSVP_MENU_OPTIONS.find((option) => option.value === menu)?.label ??
    "Menú general"
  );
}

/** Como en WP: elección de menú especial en plan premium. */
export function canChooseRsvpMenu(plan: string | null | undefined): boolean {
  return normalizePlan(plan) === "premium";
}
