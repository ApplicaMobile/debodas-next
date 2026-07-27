import { normalizePlan } from "@/lib/plans/features";

const MAX_TABLE_NAME = 60;

/** Asignación de mesas a invitados: solo Premium. */
export function canManageRsvpTables(plan: string | null | undefined): boolean {
  return normalizePlan(plan) === "premium";
}

export function sanitizeTableName(
  value: string | null | undefined,
): string | null {
  const trimmed = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_TABLE_NAME);
  if (!trimmed || trimmed === "__other__") {
    return null;
  }
  return trimmed;
}

export function collectKnownTableNames(
  guests: Array<{ tableName?: string | null }>,
): string[] {
  const names = new Set<string>();
  for (const guest of guests) {
    const name = sanitizeTableName(guest.tableName);
    if (name) names.add(name);
  }
  return Array.from(names).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base", numeric: true }),
  );
}

export function groupGuestsByTable<T extends { tableName?: string | null }>(
  guests: T[],
): Array<{ table: string; guests: T[] }> {
  const map = new Map<string, T[]>();
  const unassigned: T[] = [];

  for (const guest of guests) {
    const table = sanitizeTableName(guest.tableName);
    if (!table) {
      unassigned.push(guest);
      continue;
    }
    const list = map.get(table) ?? [];
    list.push(guest);
    map.set(table, list);
  }

  const groups = Array.from(map.entries())
    .sort(([a], [b]) =>
      a.localeCompare(b, "es", { sensitivity: "base", numeric: true }),
    )
    .map(([table, list]) => ({ table, guests: list }));

  if (unassigned.length > 0) {
    groups.push({ table: "Sin mesa", guests: unassigned });
  }

  return groups;
}
