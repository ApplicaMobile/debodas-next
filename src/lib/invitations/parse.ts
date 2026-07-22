import {
  INVITATION_OUTFITS,
  type DigitalInvitation,
  type InvitationLocation,
  type InvitationOutfit,
} from "@/lib/invitations/types";
import { isInvitationThemeSlug } from "@/lib/invitations/themes";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseLocation(value: unknown): InvitationLocation {
  const loc = asRecord(value);
  return {
    address: String(loc?.address ?? "").trim(),
    lat: String(loc?.lat ?? "").trim(),
    lng: String(loc?.lng ?? "").trim(),
  };
}

function isOutfit(value: string): value is InvitationOutfit {
  return (INVITATION_OUTFITS as readonly string[]).includes(value);
}

export function parseInvitations(misc: Record<string, unknown>): DigitalInvitation[] {
  const raw = misc.invitations;
  if (!Array.isArray(raw)) {
    return [];
  }

  const items: DigitalInvitation[] = [];

  for (const entry of raw) {
    const row = asRecord(entry);
    if (!row) continue;

    // Compat: WP nested `{ invitation: {...} }` o flat
    const inv = asRecord(row.invitation) ?? row;
    const theme = String(inv.theme ?? "");
    if (!isInvitationThemeSlug(theme)) continue;

    const outfitRaw = String(inv.outfit ?? "formal");
    const outfit = isOutfit(outfitRaw) ? outfitRaw : "formal";

    const id =
      String(inv.id ?? row.id ?? "").trim() ||
      `legacy-${items.length}-${theme}`;

    items.push({
      id,
      name: String(inv.name ?? "").trim() || "Invitación",
      title: String(inv.title ?? "").trim(),
      description: String(inv.description ?? "").trim(),
      theme,
      datetime: normalizeDatetime(String(inv.datetime ?? "")),
      outfit,
      locationName: String(inv.locationName ?? inv.location_name ?? "").trim(),
      location: parseLocation(inv.location),
      isVisibleInMicrosite: Boolean(
        inv.isVisibleInMicrosite ?? inv.is_visible_in_microsite,
      ),
      createdAt: String(inv.createdAt ?? inv.created_at ?? new Date().toISOString()),
    });
  }

  return items;
}

/** Acepta ISO, datetime-local o d/m/Y h:mm a (legacy WP). */
function normalizeDatetime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 16);
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed)) {
    return trimmed.replace(" ", "T").slice(0, 16);
  }

  // d/m/Y g:i a
  const wp = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)?/i,
  );
  if (wp) {
    const day = wp[1].padStart(2, "0");
    const month = wp[2].padStart(2, "0");
    let hour = Number(wp[4]);
    const minute = wp[5];
    const meridiem = wp[6]?.toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    return `${wp[3]}-${month}-${day}T${String(hour).padStart(2, "0")}:${minute}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    const h = String(parsed.getHours()).padStart(2, "0");
    const min = String(parsed.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  return "";
}

export function parseCanvaLink(misc: Record<string, unknown>): string {
  const value = misc.canvaInvitationUrl ?? misc.canva_invitation_url;
  return typeof value === "string" ? value.trim() : "";
}

export function toCanvaEmbedUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.includes("/view") && !trimmed.includes("embed")) {
    return trimmed.includes("?")
      ? `${trimmed}&embed`
      : trimmed.replace("/view", "/view?embed");
  }
  return trimmed;
}

export function serializeInvitations(
  invitations: DigitalInvitation[],
): DigitalInvitation[] {
  return invitations;
}
