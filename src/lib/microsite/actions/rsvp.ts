"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/lib/account/form-state";
import {
  canAddRsvpGuest,
  rsvpLimitError,
} from "@/lib/plans/limits";
import {
  canChooseRsvpMenu,
  sanitizeRsvpMenu,
} from "@/lib/rsvp/menu";
import { prisma } from "@/lib/db/prisma";
import { notifyNoviosRsvp } from "@/lib/email/notify";
import { createRsvpNotification } from "@/lib/notifications/create";
import {
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/security/rate-limit";

const PUBLIC_RSVP_STATUSES = new Set(["confirmed", "declined"]);

function collectGuestNames(formData: FormData): string[] {
  const primary = String(formData.get("name") ?? "").trim();
  const names: string[] = [];
  if (primary.length >= 2) {
    names.push(primary.slice(0, 120));
  }
  for (let index = 0; index < 15; index += 1) {
    const extra = String(formData.get(`extra_guest_name_${index}`) ?? "").trim();
    if (extra.length >= 2) {
      names.push(extra.slice(0, 120));
    }
  }
  return names;
}

export async function submitPublicRsvpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const slug = String(formData.get("boda_slug") ?? "").trim();
  const names = collectGuestNames(formData);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const status = String(formData.get("status") ?? "confirmed").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const menuRaw = String(formData.get("menu") ?? "general").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (website) {
    return { success: "¡Gracias! Recibimos tu confirmación de asistencia." };
  }

  if (!slug || slug.length > 100) {
    return { error: "No encontramos esta boda." };
  }

  if (names.length === 0) {
    return { error: "Ingresá tu nombre completo." };
  }

  if (
    email &&
    (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    return { error: "Ingresá un email válido o dejá el campo vacío." };
  }

  if (!PUBLIC_RSVP_STATUSES.has(status)) {
    return { error: "Seleccioná si vas a asistir o no." };
  }

  if (notes.length > 1000) {
    return { error: "El mensaje es demasiado largo." };
  }

  try {
    const headerStore = await headers();
    const ip = clientIpFromHeaders(headerStore);
    const [weddingLimit, ipLimit] = await Promise.all([
      checkRateLimit(`rsvp:wedding:${slug}:${ip}`, 8, 15 * 60 * 1000),
      checkRateLimit(`rsvp:ip:${ip}`, 30, 60 * 60 * 1000),
    ]);
    const limited = !weddingLimit.ok ? weddingLimit : ipLimit;
    if (!limited.ok) {
      return {
        error: `Demasiados envíos. Probá en ${limited.retryAfterSec}s.`,
      };
    }

    const boda = await prisma.boda.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        plan: true,
        _count: { select: { rsvpGuests: true } },
      },
    });

    if (!boda) {
      return { error: "No encontramos esta boda." };
    }

    if (!canAddRsvpGuest(boda.plan, boda._count.rsvpGuests + names.length - 1)) {
      return { error: rsvpLimitError(boda.plan) };
    }

    const menu =
      status === "confirmed" && canChooseRsvpMenu(boda.plan)
        ? sanitizeRsvpMenu(menuRaw)
        : "general";

    const created = await prisma.$transaction(
      names.map((name, index) =>
        prisma.rsvpGuest.create({
          data: {
            bodaId: boda.id,
            name,
            email: index === 0 && email ? email : null,
            status,
            menu,
            notes: index === 0 && notes ? notes : null,
          },
        }),
      ),
    );

    const guestLabel = names.join(", ");
    await notifyNoviosRsvp({
      bodaId: boda.id,
      guestName: guestLabel,
      status,
      menu,
      notes: notes || null,
      guestEmail: email || null,
      notificationId: created[0]?.id,
    });

    await createRsvpNotification({
      bodaId: boda.id,
      guestName: guestLabel,
      status,
      guestId: created[0]!.id,
    });

    revalidatePath(`/bodas/${boda.slug}`);
    revalidatePath("/mi-cuenta/invitados");
    revalidatePath("/mi-cuenta");

    return {
      success:
        status === "confirmed"
          ? names.length > 1
            ? `¡Gracias! Recibimos la confirmación de ${names.length} invitados.`
            : "¡Gracias! Recibimos tu confirmación de asistencia."
          : "Gracias por avisarnos. Registramos que no podrás asistir.",
    };
  } catch (error) {
    console.error("[submitPublicRsvpAction]", error);
    return {
      error:
        "No se pudo enviar la confirmación. Verificá que MySQL esté activo.",
    };
  }
}
