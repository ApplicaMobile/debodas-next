"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { FormState } from "@/lib/account/form-state";
import { prisma } from "@/lib/db/prisma";
import { notifyRatingSubmitted } from "@/lib/email/notify";
import { getCoupleDisplayName } from "@/data/bodas";
import type { Boda as BodaShape } from "@/types/boda";
import { hasEventDatePassed } from "@/lib/ratings/date";
import {
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/security/rate-limit";

export async function submitRatingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const bodaId = String(formData.get("boda_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const score = Number(formData.get("score") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (website) {
    return {
      success:
        "¡Gracias! Recibimos tu calificación. Te enviamos un email de agradecimiento.",
    };
  }

  if (!bodaId || bodaId.length > 64) {
    return { error: "Enlace de calificación inválido." };
  }

  if (name.length < 2 || name.length > 120) {
    return { error: "Ingresá tu nombre." };
  }

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { error: "Ingresá un email válido." };
  }

  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return { error: "Seleccioná una calificación de 1 a 5 estrellas." };
  }

  if (comment.length > 2000) {
    return { error: "El comentario es demasiado largo." };
  }

  try {
    const headerStore = await headers();
    const ip = clientIpFromHeaders(headerStore);
    const [weddingLimit, ipLimit] = await Promise.all([
      checkRateLimit(`rating:wedding:${bodaId}:${ip}`, 5, 60 * 60 * 1000),
      checkRateLimit(`rating:ip:${ip}`, 20, 24 * 60 * 60 * 1000),
    ]);
    const limited = !weddingLimit.ok ? weddingLimit : ipLimit;
    if (!limited.ok) {
      return {
        error: `Demasiados intentos. Probá en ${limited.retryAfterSec}s.`,
      };
    }

    const boda = await prisma.boda.findUnique({
      where: { id: bodaId },
      select: { id: true, title: true, couple: true, event: true },
    });

    if (!boda) {
      return { error: "No encontramos esta boda." };
    }

    if (!hasEventDatePassed(boda.event)) {
      return {
        error: "Podrás calificar nuestro servicio después de la fecha de tu boda.",
      };
    }

    const existing = await prisma.rating.findUnique({
      where: { bodaId_email: { bodaId, email } },
    });

    if (existing) {
      return { error: "Ya enviaste una calificación para esta boda." };
    }

    const rating = await prisma.rating.create({
      data: {
        bodaId,
        name,
        email,
        score,
        comment: comment || null,
        status: "pending",
      },
    });

    const coupleName =
      getCoupleDisplayName((boda.couple ?? {}) as BodaShape["couple"]) ||
      boda.title;

    await notifyRatingSubmitted({
      coupleName,
      name,
      email,
      score,
      comment: comment || null,
      ratingId: rating.id,
    });

    revalidatePath("/");
    revalidatePath("/calificar");

    return {
      success:
        "¡Gracias! Recibimos tu calificación. Te enviamos un email de agradecimiento.",
    };
  } catch (error) {
    console.error("[submitRatingAction]", error);
    return {
      error: "No se pudo enviar la calificación. Intentá de nuevo más tarde.",
    };
  }
}
