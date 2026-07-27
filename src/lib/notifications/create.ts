import { prisma } from "@/lib/db/prisma";

export type NotificationType = "rsvp" | "gift" | "plan";

export interface CreateNotificationInput {
  bodaId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href: string;
  entityId?: string;
}

/** No bloquea el flujo principal si falla. */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        bodaId: input.bodaId,
        type: input.type,
        title: input.title.slice(0, 200),
        body: input.body?.slice(0, 1000) || null,
        href: input.href,
        entityId: input.entityId ?? null,
      },
    });
  } catch (error) {
    console.error("[createNotification]", error);
  }
}

export async function createRsvpNotification(input: {
  bodaId: string;
  guestName: string;
  status: string;
  guestId: string;
}): Promise<void> {
  const confirmed = input.status === "confirmed";
  await createNotification({
    bodaId: input.bodaId,
    type: "rsvp",
    title: confirmed
      ? `${input.guestName} confirmó asistencia`
      : `${input.guestName} no podrá asistir`,
    body: confirmed
      ? "Nuevo RSVP en tu lista de invitados."
      : "Registramos que no asistirá.",
    href: "/mi-cuenta/invitados",
    entityId: input.guestId,
  });
}

export async function createGiftNotification(input: {
  bodaId: string;
  participants: string;
  pending: boolean;
  giftId: string;
  amountLabel?: string;
}): Promise<void> {
  await createNotification({
    bodaId: input.bodaId,
    type: "gift",
    title: input.pending
      ? `Regalo pendiente de ${input.participants}`
      : `Nuevo regalo de ${input.participants}`,
    body: input.amountLabel
      ? input.pending
        ? `${input.amountLabel} · revisá el comprobante`
        : `${input.amountLabel} · pago confirmado`
      : input.pending
        ? "Hay un regalo esperando tu confirmación."
        : "Se acreditó un regalo en tu lista.",
    href: "/mi-cuenta/regalos-recibidos",
    entityId: input.giftId,
  });
}
