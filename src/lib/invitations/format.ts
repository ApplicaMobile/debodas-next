import { OUTFIT_LABELS, type InvitationOutfit } from "@/lib/invitations/types";

export function formatInvitationDateParts(datetime: string): {
  dateLabel: string;
  timeLabel: string;
} {
  if (!datetime) {
    return { dateLabel: "", timeLabel: "" };
  }

  const date = new Date(datetime);
  if (Number.isNaN(date.getTime())) {
    return { dateLabel: datetime, timeLabel: "" };
  }

  const dateLabel = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return {
    dateLabel,
    timeLabel: `A las ${time}`,
  };
}

export function outfitLabel(outfit: InvitationOutfit): string {
  return OUTFIT_LABELS[outfit];
}

export function buildInvitationFilename(
  title: string,
  brideName: string,
  groomName: string,
): string {
  const safe = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40);

  const base =
    [safe(title), safe(brideName), "y", safe(groomName)]
      .filter(Boolean)
      .join("-") || "invitacion";

  return `${base}.png`;
}

export function buildGoogleCalendarUrl(input: {
  title: string;
  datetime: string;
  location: string;
  details?: string;
}): string | null {
  const start = new Date(input.datetime);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${y}${m}${day}T${h}${min}${s}`;
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: input.details ?? "",
    location: input.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}

/** Embed por coordenadas o, si faltan, por dirección / nombre del lugar. */
export function buildMapsEmbedUrl(input: {
  lat?: string;
  lng?: string;
  query?: string;
}): string | null {
  const lat = input.lat?.trim() ?? "";
  const lng = input.lng?.trim() ?? "";
  if (lat && lng) {
    return `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&z=15&output=embed`;
  }

  const query = input.query?.trim() ?? "";
  if (!query) {
    return null;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}
