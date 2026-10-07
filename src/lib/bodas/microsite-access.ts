import { getViewer } from "@/lib/auth/viewer";
import { isAccountActive } from "@/lib/account/status";
import {
  resolveMicrositeAccess,
  type MicrositeAccess,
  type MicrositeViewer,
} from "@/lib/bodas/visibility";

/** Campos que hay que traer de la boda para decidir si el micrositio es visible. */
export const MICROSITE_ACCESS_SELECT = {
  userId: true,
  isOnline: true,
  user: { select: { status: true, emailVerifiedAt: true } },
} as const;

export interface MicrositeAccessRow {
  userId: string;
  isOnline: boolean;
  user: { status: string; emailVerifiedAt?: Date | null } | null;
}

export async function loadMicrositeViewer(): Promise<MicrositeViewer | null> {
  const viewer = await getViewer();
  if (!viewer.session) return null;
  return { userId: viewer.session.userId, isAdmin: viewer.isAdmin };
}

/**
 * Visibilidad del micrositio para el request actual. Solo lee la sesión si hace falta
 * (cuenta activa + micrositio offline), así los micrositios online no dependen de cookies.
 */
export async function micrositeAccessFor(row: MicrositeAccessRow): Promise<MicrositeAccess> {
  const ownerStatus = row.user?.status ?? "deleted";
  // emailVerifiedAt sin seleccionar (undefined) cuenta como verificado.
  const ownerEmailVerified = row.user?.emailVerifiedAt !== null;
  const needsViewer = isAccountActive(ownerStatus) && !(row.isOnline && ownerEmailVerified);
  return resolveMicrositeAccess({
    ownerStatus,
    ownerEmailVerified,
    isOnline: row.isOnline,
    ownerId: row.userId,
    viewer: needsViewer ? await loadMicrositeViewer() : null,
  });
}

/** Para acciones públicas (RSVP, regalos, abonar): true si el visitante puede usar el micrositio. */
export async function micrositeAcceptsPublicActions(row: MicrositeAccessRow): Promise<boolean> {
  return (await micrositeAccessFor(row)) !== "hidden";
}