import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export interface MigrationWelcomeUser {
  migratedFromWp: boolean;
  welcomeSeenAt: Date | null;
}

/**
 * ¿Mostrar la pantalla de bienvenida "tu cuenta ya está en el sitio nuevo"?
 * Solo a cuentas importadas desde WordPress que todavía no la vieron.
 */
export function shouldShowMigrationWelcome(
  user: MigrationWelcomeUser | null | undefined,
): boolean {
  return Boolean(user && user.migratedFromWp && !user.welcomeSeenAt);
}

/**
 * Para server components de /mi-cuenta: lee la sesión y devuelve si
 * corresponde la bienvenida. Nunca lanza (si la BD falla, no se muestra).
 */
export async function getMigrationWelcomeForSession(): Promise<{ show: boolean }> {
  try {
    const session = await getSession();
    if (!session) return { show: false };
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { migratedFromWp: true, welcomeSeenAt: true },
    });
    return { show: shouldShowMigrationWelcome(user) };
  } catch {
    return { show: false };
  }
}
