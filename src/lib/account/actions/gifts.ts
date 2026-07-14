"use server";

import { requireOwnedBoda } from "@/lib/account/auth-boda";
import type { FormState } from "@/lib/account/form-state";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import {
  canAddGift,
  giftLimitError,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/db/prisma";

export async function updateGiftsListTitleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const title = String(formData.get("gifts_list_title") ?? "").trim();

  try {
    await prisma.boda.update({
      where: { id: boda.id },
      data: { giftsListTitle: title || null },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/regalos"]);
    return { success: "Título actualizado." };
  } catch (err) {
    console.error("[updateGiftsListTitleAction]", err);
    return { error: "No se pudo guardar." };
  }
}

export async function addGiftAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "1").trim();
  const price = Number(priceRaw.replace(/\./g, "").replace(",", "."));
  const quantity = Number(quantityRaw) || 1;

  if (!title || Number.isNaN(price) || price < 0) {
    return { error: "Completá título y precio válido." };
  }

  const count = await prisma.gift.count({ where: { bodaId: boda.id } });

  if (!canAddGift(boda.plan, count)) {
    return { error: giftLimitError(boda.plan) };
  }

  try {
    await prisma.gift.create({
      data: {
        bodaId: boda.id,
        title,
        price,
        quantity,
        sortOrder: count,
      },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/regalos"]);
    return { success: "Regalo agregado." };
  } catch (err) {
    console.error("[addGiftAction]", err);
    return { error: "No se pudo agregar el regalo." };
  }
}

export async function deleteGiftAction(formData: FormData): Promise<void> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return;
  }

  const giftId = String(formData.get("gift_id") ?? "");
  if (!giftId) {
    return;
  }

  await prisma.gift.deleteMany({
    where: { id: giftId, bodaId: boda.id },
  });

  revalidateBodaPaths(boda.slug, ["/mi-cuenta/regalos"]);
}
