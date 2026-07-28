export function notificationTypeLabel(type: string): string {
  if (type === "rsvp") return "RSVP";
  if (type === "gift") return "Regalo";
  if (type === "plan") return "Plan";
  return "Aviso";
}

export function notificationTypeBadgeClass(type: string): string {
  if (type === "rsvp") return "bg-emerald-50 text-emerald-800";
  if (type === "gift") return "bg-amber-50 text-amber-900";
  if (type === "plan") return "bg-sky-50 text-sky-900";
  return "bg-stone-100 text-stone-700";
}

export function formatNotificationRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
