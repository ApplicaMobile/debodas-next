/**
 * Estado de cuenta (User.status). Sin dependencias de Next: se usa en login,
 * sesión, micrositio, admin y tests.
 *
 * - active: normal.
 * - suspended: el admin la suspendió (reversible). No puede entrar; el micrositio no se ve.
 * - deleted: baja lógica. Desaparece de todos lados pero las filas quedan.
 *   Si además tiene `erasedAt`, fue un borrado definitivo pedido por la pareja
 *   (datos anonimizados) y no se puede restaurar.
 */
export const ACCOUNT_STATUSES = ["active", "suspended", "deleted"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ACTIVE_STATUS: AccountStatus = "active";

/** Filtro Prisma para "solo cuentas activas" (User). */
export const ACTIVE_USER_WHERE = { status: "active" } as const;

/** Dueños cuyo micrositio puede aparecer en listados públicos (home, sitemap): activos y con email verificado. */
export const PUBLIC_OWNER_WHERE = { status: "active", emailVerifiedAt: { not: null } } as const;

export function normalizeAccountStatus(value: unknown): AccountStatus {
  return value === "suspended" || value === "deleted" ? value : "active";
}

/** Una cuenta sin estado (filas viejas) cuenta como activa. */
export function isAccountActive(status: string | null | undefined): boolean {
  return normalizeAccountStatus(status) === "active";
}

export type LoginStatusOutcome = "ok" | "suspended" | "invalid";

/**
 * Qué hacer en el login con una cuenta cuya clave ya se verificó.
 * Eliminada se comporta como credenciales inválidas (no revela que existió).
 */
export function loginOutcomeForStatus(status: string | null | undefined): LoginStatusOutcome {
  const normalized = normalizeAccountStatus(status);
  if (normalized === "suspended") return "suspended";
  if (normalized === "deleted") return "invalid";
  return "ok";
}

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Activa",
  suspended: "Suspendida",
  deleted: "Eliminada",
};

/** Clave en `boda.misc` donde se recuerda si el micrositio estaba online antes de suspender/eliminar. */
export const PREV_ONLINE_MISC_KEY = "account_status_prev_online";

/** Email anonimizado de una cuenta borrada definitivamente. */
export function erasedEmailFor(userId: string): string {
  return `deleted+${userId}@invalid.debodas`;
}

/** Slug que ocupa una boda borrada definitivamente (libera el original). */
export function erasedSlugFor(bodaId: string): string {
  return `eliminada-${bodaId}`;
}