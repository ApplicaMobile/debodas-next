"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getCoupleDisplayName } from "@/data/bodas";
import { notifyRatingRequest } from "@/lib/email/notify";
import { prisma } from "@/lib/db/prisma";
import type { Boda as BodaShape } from "@/types/boda";

export async function updateRatingStatusAction(formData: FormData) {
  await requireAdmin();

  const ratingId = String(formData.get("rating_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!ratingId || !["approved", "rejected", "pending"].includes(status)) {
    return;
  }

  await prisma.rating.update({
    where: { id: ratingId },
    data: { status },
  });

  revalidatePath("/admin/calificaciones");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateBodaPlanAction(formData: FormData) {
  await requireAdmin();

  const bodaId = String(formData.get("boda_id") ?? "").trim();
  const plan = String(formData.get("plan") ?? "").trim().toLowerCase();

  if (!bodaId || !["free", "basico", "premium"].includes(plan)) {
    return;
  }

  const boda = await prisma.boda.update({
    where: { id: bodaId },
    data: { plan },
    select: { id: true, slug: true },
  });

  revalidatePath("/admin/bodas");
  revalidatePath(`/admin/bodas/${boda.id}`);
  revalidatePath(`/bodas/${boda.slug}`);
  revalidatePath("/mi-cuenta/plan");
  revalidatePath("/admin");
  revalidatePath("/admin/estadisticas");
}

export async function updateBodaOnlineAction(formData: FormData) {
  await requireAdmin();

  const bodaId = String(formData.get("boda_id") ?? "").trim();
  const isOnline = formData.get("is_online") === "on";

  if (!bodaId) {
    return;
  }

  const existing = await prisma.boda.findUnique({
    where: { id: bodaId },
    select: { id: true, slug: true, options: true },
  });
  if (!existing) {
    return;
  }

  const prev =
    existing.options &&
    typeof existing.options === "object" &&
    !Array.isArray(existing.options)
      ? (existing.options as Record<string, Prisma.InputJsonValue>)
      : {};

  await prisma.boda.update({
    where: { id: bodaId },
    data: {
      isOnline,
      options: {
        ...prev,
        is_online: isOnline ? 1 : 0,
      },
    },
  });

  revalidatePath("/admin/bodas");
  revalidatePath(`/admin/bodas/${existing.id}`);
  revalidatePath(`/bodas/${existing.slug}`);
  revalidatePath("/mi-cuenta/plan");
  revalidatePath("/admin/estadisticas");
}

export async function sendRatingRequestAction(formData: FormData) {
  await requireAdmin();

  const bodaId = String(formData.get("boda_id") ?? "").trim();
  if (!bodaId) {
    redirect("/admin/bodas");
  }

  const boda = await prisma.boda.findUnique({
    where: { id: bodaId },
    select: {
      id: true,
      title: true,
      couple: true,
      user: { select: { email: true, name: true } },
      ratings: { select: { id: true }, take: 1 },
    },
  });

  if (!boda) {
    redirect("/admin/bodas?error=boda");
  }

  const detailPath = `/admin/bodas/${boda.id}`;

  if (!boda.user.email) {
    redirect(`${detailPath}?error=${encodeURIComponent("sin-email")}`);
  }

  if (boda.ratings.length > 0) {
    redirect(
      `${detailPath}?error=${encodeURIComponent("ya-calificada")}`,
    );
  }

  const coupleName =
    boda.user.name ||
    getCoupleDisplayName((boda.couple ?? {}) as BodaShape["couple"]) ||
    boda.title;

  try {
    const result = await notifyRatingRequest({
      to: boda.user.email,
      coupleName,
      bodaId: boda.id,
    });

    await prisma.boda.update({
      where: { id: boda.id },
      data: { ratingEmailSentAt: new Date() },
    });

    revalidatePath(detailPath);
    revalidatePath("/admin/bodas");
    const okMessage = result.simulated
      ? "Pedido registrado (email simulado: falta RESEND_API_KEY)."
      : result.skipped
        ? "Pedido registrado pero el email no se envió."
        : "Email de calificación enviado.";
    redirect(`${detailPath}?ok=${encodeURIComponent(okMessage)}`);
  } catch (error) {
    console.error("[sendRatingRequestAction]", error);
    redirect(
      `${detailPath}?error=${encodeURIComponent("No se pudo enviar el email (Resend).")}`,
    );
  }
}

export async function resetRatingEmailFlagAction(formData: FormData) {
  await requireAdmin();

  const bodaId = String(formData.get("boda_id") ?? "").trim();
  if (!bodaId) {
    return;
  }

  await prisma.boda.update({
    where: { id: bodaId },
    data: { ratingEmailSentAt: null },
  });

  revalidatePath(`/admin/bodas/${bodaId}`);
  revalidatePath("/admin/bodas");
}

export async function confirmGiftAdminAction(formData: FormData) {
  await requireAdmin();

  const giftId = String(formData.get("gift_id") ?? "").trim();
  if (!giftId) {
    return;
  }

  await prisma.confirmedGift.update({
    where: { id: giftId },
    data: { confirmed: true },
  });

  revalidatePath("/admin/pagos");
  revalidatePath("/admin");
  revalidatePath("/mi-cuenta/regalos-recibidos");
}

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();

  const userId = String(formData.get("user_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!userId || !["admin", "couple"].includes(role)) {
    redirect("/admin/usuarios?error=datos");
  }

  if (userId === admin.id && role !== "admin") {
    redirect("/admin/usuarios?error=self");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  redirect("/admin/usuarios?ok=1");
}
