"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/lib/account/form-state";
import {
  canAddRsvpGuest,
  rsvpLimitError,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/db/prisma";

const PUBLIC_RSVP_STATUSES = new Set(["confirmed", "declined"]);

export async function submitPublicRsvpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const slug = String(formData.get("boda_slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const status = String(formData.get("status") ?? "confirmed").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!slug) {
    return { error: "No encontramos esta boda." };
  }

  if (name.length < 2) {
    return { error: "Ingresá tu nombre completo." };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Ingresá un email válido o dejá el campo vacío." };
  }

  if (!PUBLIC_RSVP_STATUSES.has(status)) {
    return { error: "Seleccioná si vas a asistir o no." };
  }

  try {
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

    await prisma.rsvpGuest.create({
      data: {
        bodaId: boda.id,
        name,
        email: email || null,
        status,
        notes: notes || null,
      },
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
