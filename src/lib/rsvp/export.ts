/** Helpers client-side para filtrar y exportar invitados RSVP. */

export type RsvpStatusFilter = "all" | "pending" | "confirmed" | "declined";

export const RSVP_STATUS_FILTERS: Array<{
  value: RsvpStatusFilter;
  label: string;
  /** Clases cuando el chip está activo */
  activeClass: string;
  /** Clases cuando está inactivo */
  idleClass: string;
}> = [
  {
    value: "all",
    label: "Todos",
    activeClass: "bg-stone-800 text-white border-stone-800",
    idleClass: "bg-white text-stone-700 border-stone-200 hover:bg-stone-50",
  },
  {
    value: "confirmed",
    label: "Confirmados",
    activeClass: "bg-emerald-600 text-white border-emerald-600",
    idleClass:
      "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  },
  {
    value: "pending",
    label: "Pendientes",
    activeClass: "bg-amber-500 text-white border-amber-500",
    idleClass: "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100",
  },
  {
    value: "declined",
    label: "No asisten",
    activeClass: "bg-rose-600 text-white border-rose-600",
    idleClass: "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100",
  },
];

export const TABLE_FILTER_ALL = "all";
export const TABLE_FILTER_NONE = "__none__";

export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildGuestsCsv(
  guests: Array<{
    name: string;
    email: string | null;
    status: string;
    menu: string;
    tableName: string | null;
    notes: string | null;
  }>,
  statusLabel: (status: string) => string,
  menuLabel: (menu: string) => string,
): string {
  const header = [
    "Nombre",
    "Email",
    "Estado",
    "Menú",
    "Mesa",
    "Notas",
  ].join(",");

  const rows = guests.map((guest) =>
    [
      csvEscape(guest.name),
      csvEscape(guest.email ?? ""),
      csvEscape(statusLabel(guest.status)),
      csvEscape(menuLabel(guest.menu)),
      csvEscape(guest.tableName ?? ""),
      csvEscape(guest.notes ?? ""),
    ].join(","),
  );

  return [header, ...rows].join("\r\n");
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/csv;charset=utf-8",
) {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
