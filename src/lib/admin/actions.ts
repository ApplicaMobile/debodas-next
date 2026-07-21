"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import {
  getAdminAuditContext,
  writeAdminAudit,
} from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getCoupleDisplayName } from "@/data/bodas";
import { notifyRatingRequest } from "@/lib/email/notify";
import { prisma } from "@/lib/db/prisma";
import type { Boda as BodaShape } from "@/types/boda";

export async function updateRatingStatusAction(formData: FormData) {
  const admin = await requireAdmin();

  const ratingId = String(formData.get("rating_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!ratingId || !["approved", "rejected", "pending"].includes(status)) {
    return;
  }

  const audit = await getAdminAuditContext(admin);
  await prisma.$transaction(async (tx) => {
    const previous = await tx.rating.findUnique({
      where: { id: ratingId },
      select: { status: true, bodaId: true },
    });
    if (!previous || previous.status === status) return;

    await tx.rating.update({
      where: { id: ratingId },
      data: { status },
    });
    await writeAdminAudit(tx, audit, {
      action: "admin.rating.status_changed",
      entity: "rating",
      entityId: ratingId,
      metadata: {
        previousStatus: previous.status,
        newStatus: status,
        bodaId: previous.bodaId,
      },
    });
  });

  revalidatePath("/admin/calificaciones");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateBodaPlanAction(formData: FormData) {
  const admin = await requireAdmin();

  const bodaId = String(formData.get("boda_id") ?? "").trim();
  const plan = String(formData.get("plan") ?? "").trim().toLowerCase();

  if (!bodaId || !["free", "basico", "premium"].includes(plan)) {
    return;
  }

  const audit = await getAdminAuditContext(admin);
  const boda = await prisma.$transaction(async (tx) => {
    const previous = await tx.boda.findUnique({
      where: { id: bodaId },
      select: { id: true, slug: true, plan: true },
    });
    if (!previous || previous.plan === plan) return previous;

    const updated = await tx.boda.update({
      where: { id: bodaId },
      data: { plan },
      select: { id: true, slug: true },
    });
    await writeAdminAudit(tx, audit, {
      action: "admin.boda.plan_changed",
      entity: "boda",
      entityId: bodaId,
      metadata: { previousPlan: previous.plan, newPlan: plan },
    });
    return updated;
  });
  if (!boda) return;

  revalidatePath("/admin/bodas");
  revalidatePath(`/admin/bodas/${boda.id}`);
  revalidatePath(`/bodas/${boda.slug}`);
  revalidatePath("/mi-cuenta/plan");
  revalidatePath("/admin");
  revalidatePath("/admin/estadisticas");
}

export async function updateBodaOnlineAction(formData: FormData) {
  const admin = await requireAdmin();

  const bodaId = String(formData.get("boda_id") ?? "").trim();
  const isOnline = formData.get("is_online") === "on";

  if (!bodaId) {
    return;
  }

  const existing = await prisma.boda.findUnique({
    where: { id: bodaId },
    select: { id: true, slug: true, options: true, isOnline: true },
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

  if (existing.isOnline !== isOnline) {
    const audit = await getAdminAuditContext(admin);
    await prisma.$transaction(async (tx) => {
      await tx.boda.update({
        where: { id: bodaId },
        data: {
          isOnline,
          options: {
            ...prev,
            is_online: isOnline ? 1 : 0,
          },
        },
      });
      await writeAdminAudit(tx, audit, {
        action: "admin.boda.online_changed",
        entity: "boda",
        entityId: bodaId,
        metadata: {
          previousOnline: existing.isOnline,
          newOnline: isOnline,
          slug: existing.slug,
        },
      });
    });
  }

  revalidatePath("/admin/bodas");
  revalidatePath(`/admin/bodas/${existing.id}`);
  revalidatePath(`/bodas/${existing.slug}`);
  revalidatePath("/mi-cuenta/plan");
  revalidatePath("/admin/estadisticas");
}

export async function sendRatingRequestAction(formData: FormData) {
  const admin = await requireAdmin();

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
  const audit = await getAdminAuditContext(admin);

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

    const delivered = !result.simulated && !result.skipped;
    await prisma.$transaction(async (tx) => {
      if (delivered) {
        await tx.boda.update({
          where: { id: boda.id },
          data: { ratingEmailSentAt: new Date() },
        });
      }
      await writeAdminAudit(tx, audit, {
        action: "admin.boda.rating_request_sent",
        entity: "boda",
        entityId: boda.id,
        metadata: {
          outcome: delivered ? "sent" : result.simulated ? "simulated" : "skipped",
          simulated: result.simulated,
          skipped: result.skipped,
        },
      });
    });

    revalidatePath(detailPath);
    revalidatePath("/admin/bodas");
    const okMessage = result.simulated
      ? "Email simulado: revisá la configuración SMTP."
      : result.skipped
        ? "Pedido registrado pero el email no se envió."
        : "Email de calificación enviado.";
    redirect(`${detailPath}?ok=${encodeURIComponent(okMessage)}`);
  } catch (error) {
    console.error("[sendRatingRequestAction]", error);
    await prisma
      .$transaction((tx) =>
        writeAdminAudit(tx, audit, {
          action: "admin.boda.rating_request_failed",
          entity: "boda",
          entityId: boda.id,
          metadata: { outcome: "failed" },
        }),
      )
      .catch((auditError) =>
        console.error("[sendRatingRequestAction audit]", auditError),
      );
    redirect(
      `${detailPath}?error=${encodeURIComponent("No se pudo enviar el email por SMTP.")}`,
    );
  }
}

export async function resetRatingEmailFlagAction(formData: FormData) {
  const admin = await requireAdmin();

  const bodaId = String(formData.get("boda_id") ?? "").trim();
  if (!bodaId) {
    return;
  }

  const audit = await getAdminAuditContext(admin);
  await prisma.$transaction(async (tx) => {
    const previous = await tx.boda.findUnique({
      where: { id: bodaId },
      select: { ratingEmailSentAt: true },
    });
    if (!previous?.ratingEmailSentAt) return;

    await tx.boda.update({
      where: { id: bodaId },
      data: { ratingEmailSentAt: null },
    });
    await writeAdminAudit(tx, audit, {
      action: "admin.boda.rating_email_flag_reset",
      entity: "boda",
      entityId: bodaId,
      metadata: { previousSentAt: previous.ratingEmailSentAt.toISOString() },
    });
  });

  revalidatePath(`/admin/bodas/${bodaId}`);
  revalidatePath("/admin/bodas");
}

export async function confirmGiftAdminAction(formData: FormData) {
  const admin = await requireAdmin();

  const giftId = String(formData.get("gift_id") ?? "").trim();
  if (!giftId) {
    return;
  }

  const audit = await getAdminAuditContext(admin);
  await prisma.$transaction(async (tx) => {
    const previous = await tx.confirmedGift.findUnique({
      where: { id: giftId },
      select: {
        confirmed: true,
        bodaId: true,
        paymentId: true,
        method: true,
      },
    });
    if (!previous || previous.confirmed) return;

    await tx.confirmedGift.update({
      where: { id: giftId },
      data: { confirmed: true },
    });
    await writeAdminAudit(tx, audit, {
      action: "admin.confirmed_gift.confirmed",
      entity: "confirmedGift",
      entityId: giftId,
      metadata: {
        bodaId: previous.bodaId,
        paymentId: previous.paymentId,
        method: previous.method,
      },
    });
  });

  revalidatePath("/admin/pagos");
  revalidatePath("/admin");
  revalidatePath("/mi-cuenta/regalos-recibidos");
}

function adminUsersPath(
  formData: FormData,
  result: { ok?: string; error?: string },
) {
  const params = new URLSearchParams(result);
  const q = String(formData.get("q") ?? "").trim().slice(0, 200);
  const page = Number.parseInt(String(formData.get("page") ?? "1"), 10);
  if (q) params.set("q", q);
  if (Number.isFinite(page) && page > 1) params.set("page", String(page));
  return `/admin/usuarios?${params.toString()}`;
}

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();

  const userId = String(formData.get("user_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!userId || !["admin", "couple"].includes(role)) {
    redirect(adminUsersPath(formData, { error: "datos" }));
  }

  if (userId === admin.id && role !== "admin") {
    redirect(adminUsersPath(formData, { error: "self" }));
  }

  const audit = await getAdminAuditContext(admin);
  await prisma.$transaction(async (tx) => {
    const previous = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!previous || previous.role === role) return;

    await tx.user.update({
      where: { id: userId },
      data: { role },
    });
    await writeAdminAudit(tx, audit, {
      action: "admin.user.role_changed",
      entity: "user",
      entityId: userId,
      metadata: { previousRole: previous.role, newRole: role },
    });
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  redirect(adminUsersPath(formData, { ok: "1" }));
}
