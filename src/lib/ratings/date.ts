/** Parsea fechas tipo DD/MM/YYYY o YYYY-MM-DD a Date (solo día local). */
export function parseEventDate(raw: unknown): Date | null {
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }

  const value = raw.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(value.replace(/\//g, "-"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function hasEventDatePassed(event: unknown): boolean {
  const dateRaw =
    event && typeof event === "object" && "date" in event
      ? (event as { date?: unknown }).date
      : null;
  const eventDate = parseEventDate(dateRaw);
  if (!eventDate) {
    return false;
  }
  return eventDate.getTime() <= startOfToday().getTime();
}
