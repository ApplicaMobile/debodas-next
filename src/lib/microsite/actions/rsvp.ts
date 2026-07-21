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
import {
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/security/rate-limit";

const PUBLIC_RSVP_STATUSES = new Set(["confirmed", "declined"]);

export async function submitPublicRsvpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const slug = String(formData.get("boda_slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
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

  if (name.length < 2 || name.length > 120) {
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

    if (!canAddRsvpGuest(boda.plan, boda._count.rsvpGuests)) {
      return { error: rsvpLimitError(boda.plan) };
    }

    const menu =
      status === "confirmed" && canChooseRsvpMenu(boda.plan)
        ? sanitizeRsvpMenu(menuRaw)
        : "general";

    const guest = await prisma.rsvpGuest.create({
      data: {
        bodaId: boda.id,
        name,
        email: email || null,
        status,
        menu,
        notes: notes || null,
      },
    });

    await notifyNoviosRsvp({
      bodaId: boda.id,
      guestName: name,
      status,
      menu,
      notes: notes || null,
      guestEmail: email || null,
      notificationId: guest.id,
    });

    revalidatePath(`/bodas/${boda.slug}`);
    revalidatePath("/mi-cuenta/invitados");

    return {
      success:
        status === "confirmed"
          ? "¡Gracias! Recibimos tu confirmación de asistencia."
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
