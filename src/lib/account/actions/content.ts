"use server";

import { revalidatePath } from "next/cache";
import { requireOwnedBoda } from "@/lib/account/auth-boda";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import type { FormState } from "@/lib/account/form-state";
import {
  canAddRsvpGuest,
  rsvpLimitError,
} from "@/lib/plans/limits";
import { sanitizeRsvpMenu } from "@/lib/rsvp/menu";
import { sanitizeScheduleIcon } from "@/lib/schedule/icons";
import { prisma } from "@/lib/db/prisma";

function parseOptions(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

export async function addScheduleItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const time = String(formData.get("time") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = sanitizeScheduleIcon(String(formData.get("icon") ?? "anillos"));

  if (!time || !title) {
    return { error: "Completá hora y título." };
  }

  const count = await prisma.scheduleItem.count({ where: { bodaId: boda.id } });

  try {
    await prisma.scheduleItem.create({
      data: {
        bodaId: boda.id,
        time,
        title,
        description: description || null,
        icon,
        sortOrder: count,
      },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/cronograma"]);
    return { success: "Ítem agregado al cronograma." };
  } catch (err) {
    console.error("[addScheduleItemAction]", err);
    return { error: "No se pudo agregar." };
  }
}

export async function deleteScheduleItemAction(formData: FormData): Promise<void> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return;
  }

  const itemId = String(formData.get("item_id") ?? "");
  if (!itemId) {
    return;
  }

  await prisma.scheduleItem.deleteMany({
    where: { id: itemId, bodaId: boda.id },
  });

  revalidateBodaPaths(boda.slug, ["/mi-cuenta/cronograma"]);
}

export async function addFaqItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();

  if (!question || !answer) {
    return { error: "Completá pregunta y respuesta." };
  }

  const count = await prisma.faqItem.count({ where: { bodaId: boda.id } });

  try {
    await prisma.faqItem.create({
      data: {
        bodaId: boda.id,
        question,
        answer,
        sortOrder: count,
      },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/faq"]);
    return { success: "Pregunta agregada al FAQ." };
  } catch (err) {
    console.error("[addFaqItemAction]", err);
    return { error: "No se pudo agregar." };
  }
}

export async function deleteFaqItemAction(formData: FormData): Promise<void> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return;
  }

  const itemId = String(formData.get("item_id") ?? "");
  if (!itemId) {
    return;
  }

  await prisma.faqItem.deleteMany({
    where: { id: itemId, bodaId: boda.id },
  });

  revalidateBodaPaths(boda.slug, ["/mi-cuenta/faq"]);
}

export async function updateOptionsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const showFaq = formData.get("show_faq") === "on" ? 1 : 0;
  const showDressCode = formData.get("show_dress_code") === "on" ? 1 : 0;
  const isOnline = formData.get("is_online") === "on";

  const options = {
    ...parseOptions(boda.options),
    show_faq: showFaq,
    show_dress_code: showDressCode,
    is_online: isOnline ? 1 : 0,
  };

  try {
    await prisma.boda.update({
      where: { id: boda.id },
      data: { options, isOnline },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/plan"]);
    revalidatePath("/admin/estadisticas");
    return { success: "Opciones guardadas." };
  } catch (err) {
    console.error("[updateOptionsAction]", err);
    return { error: "No se pudieron guardar las opciones." };
  }
}

export async function addRsvpGuestAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const status = String(formData.get("status") ?? "pending").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const menu = sanitizeRsvpMenu(String(formData.get("menu") ?? "general"));

  if (!name) {
    return { error: "El nombre es obligatorio." };
  }

  const count = await prisma.rsvpGuest.count({ where: { bodaId: boda.id } });
  if (!canAddRsvpGuest(boda.plan, count)) {
    return { error: rsvpLimitError(boda.plan) };
  }

  try {
    await prisma.rsvpGuest.create({
      data: {
        bodaId: boda.id,
        name,
        email: email || null,
        status: status || "pending",
        menu,
        notes: notes || null,
      },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/invitados"]);
    return { success: "Invitado agregado." };
  } catch (err) {
    console.error("[addRsvpGuestAction]", err);
    return { error: "No se pudo agregar el invitado." };
  }
}

export async function deleteRsvpGuestAction(formData: FormData): Promise<void> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return;
  }

  const guestId = String(formData.get("guest_id") ?? "");
  if (!guestId) {
    return;
  }

  await prisma.rsvpGuest.deleteMany({
    where: { id: guestId, bodaId: boda.id },
  });

  revalidateBodaPaths(boda.slug, ["/mi-cuenta/invitados"]);
}

export async function updateRsvpStatusAction(formData: FormData): Promise<void> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return;
  }

  const guestId = String(formData.get("guest_id") ?? "");
  const status = String(formData.get("status") ?? "pending");
  if (!guestId) {
    return;
  }

  await prisma.rsvpGuest.updateMany({
    where: { id: guestId, bodaId: boda.id },
    data: { status },
  });

  revalidateBodaPaths(boda.slug, ["/mi-cuenta/invitados"]);
}
