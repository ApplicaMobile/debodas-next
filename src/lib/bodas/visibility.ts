import { isAccountActive } from "@/lib/account/status";

export type MicrositeAccess = "public" | "preview" | "hidden";

export interface MicrositeViewer {
  userId: string | null;
  isAdmin: boolean;
}

/**
 * ¿Quién puede ver un micrositio?
 * - Cuenta suspendida o eliminada: nadie (desaparece).
 * - Online: todos.
 * - Offline (o email del dueño sin verificar): solo la pareja dueña y los admins, como vista previa.
 */
export function resolveMicrositeAccess(input: {
  ownerStatus: string | null | undefined;
  isOnline: boolean;
  ownerId: string;
  viewer: MicrositeViewer | null;
  /** false = registro sin verificar: el micrositio se trata como offline. Por defecto true. */
  ownerEmailVerified?: boolean;
}): MicrositeAccess {
  if (!isAccountActive(input.ownerStatus)) return "hidden";
  if (input.isOnline && input.ownerEmailVerified !== false) return "public";
  const viewer = input.viewer;
  if (viewer && (viewer.isAdmin || (viewer.userId && viewer.userId === input.ownerId))) {
    return "preview";
  }
  return "hidden";
}