"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

/**
 * Marca la bienvenida de migración como vista (idempotente).
 * Pensada para el botón "Entendido" de la pantalla que arme diseño.
 */
export async function markMigrationWelcomeSeenAction(): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) {
    return { ok: false };
  }
  await prisma.user.updateMany({
    where: { id: session.userId, welcomeSeenAt: null },
    data: { welcomeSeenAt: new Date() },
  });
  revalidatePath("/mi-cuenta");
  return { ok: true };
}
