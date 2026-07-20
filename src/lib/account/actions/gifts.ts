"use server";

import { requireOwnedBoda } from "@/lib/account/auth-boda";
import type { FormState } from "@/lib/account/form-state";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import {
  canAddGift,
  giftLimitError,
} from "@/lib/plans/limits";
import {
  deleteLocalUpload,
  getUploadErrorMessage,
  isManagedUpload,
  saveUploadedImage,
} from "@/lib/upload/local";
import { prisma } from "@/lib/db/prisma";

function parseImageUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }
  if (value.startsWith("/uploads/")) {
    return value;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

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
  const imageUrlRaw = String(formData.get("image_url") ?? "").trim();
  const imageFile = formData.get("image_file");
  const price = Number(priceRaw.replace(/\./g, "").replace(",", "."));
  const quantity = Number(quantityRaw) || 1;

  if (!title || Number.isNaN(price) || price < 0) {
    return { error: "Completá título y precio válido." };
  }

  const count = await prisma.gift.count({ where: { bodaId: boda.id } });

  if (!canAddGift(boda.plan, count)) {
    return { error: giftLimitError(boda.plan) };
  }

  let imageUrl: string | null = parseImageUrl(imageUrlRaw);
  if (imageUrlRaw && !imageUrl) {
    return { error: "La URL de imagen no es válida." };
  }

  try {
    if (imageFile instanceof File && imageFile.size > 0) {
      imageUrl = await saveUploadedImage(
        imageFile,
        `bodas/${boda.slug}/gifts`,
      );
    }

    await prisma.gift.create({
      data: {
        bodaId: boda.id,
        title,
        price,
        quantity,
        imageUrl,
        sortOrder: count,
      },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/regalos", `/bodas/${boda.slug}`]);
    return { success: "Regalo agregado." };
  } catch (err) {
    console.error("[addGiftAction]", err);
    return { error: getUploadErrorMessage(err) };
  }
}

export async function updateGiftAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const giftId = String(formData.get("gift_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "1").trim();
  const imageUrlRaw = String(formData.get("image_url") ?? "").trim();
  const clearImage = String(formData.get("clear_image") ?? "") === "1";
  const imageFile = formData.get("image_file");
  const price = Number(priceRaw.replace(/\./g, "").replace(",", "."));
  const quantity = Number(quantityRaw) || 1;

  if (!giftId) {
    return { error: "Regalo no válido." };
  }

  if (!title || Number.isNaN(price) || price < 0) {
    return { error: "Completá título y precio válido." };
  }

  const gift = await prisma.gift.findFirst({
    where: { id: giftId, bodaId: boda.id },
  });

  if (!gift) {
    return { error: "No encontramos el regalo." };
  }

  let nextImageUrl: string | null | undefined = undefined;

  if (clearImage) {
    nextImageUrl = null;
  } else if (imageFile instanceof File && imageFile.size > 0) {
    try {
      nextImageUrl = await saveUploadedImage(
        imageFile,
        `bodas/${boda.slug}/gifts`,
      );
    } catch (err) {
      return { error: getUploadErrorMessage(err) };
    }
  } else if (imageUrlRaw) {
    const parsed = parseImageUrl(imageUrlRaw);
    if (!parsed) {
      return { error: "La URL de imagen no es válida." };
    }
    nextImageUrl = parsed;
  }

  try {
    await prisma.gift.update({
      where: { id: gift.id },
      data: {
        title,
        price,
        quantity,
        ...(nextImageUrl !== undefined ? { imageUrl: nextImageUrl } : {}),
      },
    });

    if (
      nextImageUrl !== undefined &&
      gift.imageUrl &&
      gift.imageUrl !== nextImageUrl &&
      isManagedUpload(gift.imageUrl)
    ) {
      await deleteLocalUpload(gift.imageUrl);
    }

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/regalos", `/bodas/${boda.slug}`]);
    return { success: "Regalo actualizado." };
  } catch (err) {
    console.error("[updateGiftAction]", err);
    return { error: "No se pudo actualizar el regalo." };
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

  const gift = await prisma.gift.findFirst({
    where: { id: giftId, bodaId: boda.id },
    select: { imageUrl: true },
  });

  await prisma.gift.deleteMany({
    where: { id: giftId, bodaId: boda.id },
  });

  if (gift?.imageUrl && isManagedUpload(gift.imageUrl)) {
    await deleteLocalUpload(gift.imageUrl);
  }

  revalidateBodaPaths(boda.slug, ["/mi-cuenta/regalos", `/bodas/${boda.slug}`]);
}
