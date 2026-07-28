"use server";

import { revalidatePath } from "next/cache";
import { requireOwnedBoda } from "@/lib/account/auth-boda";
import { prisma } from "@/lib/db/prisma";

export async function markNotificationReadAction(
  notificationId: string,
): Promise<void> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) return;

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      bodaId: boda.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/mi-cuenta");
  revalidatePath("/mi-cuenta/notificaciones");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) return;

  await prisma.notification.updateMany({
    where: { bodaId: boda.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/mi-cuenta");
  revalidatePath("/mi-cuenta/notificaciones");
}
