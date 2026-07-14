import { apiFetch } from "./client";
import type { Boda, HealthResponse } from "@/types/boda";

export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health", { next: { revalidate: 0 } });
}

export async function getBodaBySlug(slug: string): Promise<Boda> {
  return apiFetch<Boda>(`/bodas/${encodeURIComponent(slug)}`);
}

export function getCoupleDisplayName(couple: Boda["couple"]): string {
  const bride =
    (couple.bride_name as string | undefined) ??
    (couple.bride as string | undefined) ??
    "";
  const groom =
    (couple.groom_name as string | undefined) ??
    (couple.groom as string | undefined) ??
    "";

  const names = [bride, groom].filter(Boolean);
  return names.length > 0 ? names.join(" & ") : "Pareja";
}

export function getEventDate(event: Boda["event"]): string | null {
  if (!event?.date || typeof event.date !== "string") {
    return null;
  }
  return event.date;
}

export function getBannerUrl(boda: Boda): string | null {
  const banner = boda.banner?.image as { url?: string } | undefined;
  if (banner?.url) {
    return banner.url;
  }
  return boda.featured_image?.url ?? null;
}
