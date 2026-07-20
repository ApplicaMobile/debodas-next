import { getCoupleDisplayName } from "@/data/bodas";
import type { Boda as BodaShape } from "@/types/boda";

export function eventDateFromJson(event: unknown): string {
  if (event && typeof event === "object" && "date" in event) {
    const date = (event as { date?: unknown }).date;
    return typeof date === "string" && date.trim() ? date.trim() : "—";
  }
  return "—";
}

export function phoneFromCouple(couple: unknown): string {
  if (couple && typeof couple === "object" && "phone" in couple) {
    const phone = (couple as { phone?: unknown }).phone;
    return typeof phone === "string" && phone.trim() ? phone.trim() : "—";
  }
  return "—";
}

export function coupleLabel(couple: unknown, fallback: string): string {
  return getCoupleDisplayName((couple ?? {}) as BodaShape["couple"]) || fallback;
}

export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
