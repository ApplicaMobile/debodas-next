"use server";

import type { Prisma } from "@prisma/client";
import { requireOwnedBoda } from "@/lib/account/auth-boda";
import type { FormState } from "@/lib/account/form-state";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import { canAddPicture, pictureLimitError } from "@/lib/plans/limits";
import { prisma } from "@/lib/db/prisma";
import {
  deleteLocalUpload,
  getUploadErrorMessage,
  saveUploadedImage,
} from "@/lib/upload/local";

function parseBanner(value: unknown): Prisma.JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.JsonObject;
  }
  return {};
}

function getBannerUrl(banner: Prisma.JsonObject): string {
  const image = banner.image;
  if (image && typeof image === "object" && !Array.isArray(image) && "url" in image) {
    return String(image.url ?? "");
  }
  return "";
}

export async function uploadBannerFileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const file = formData.get("banner_file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleccioná una imagen para el banner." };
  }

  try {
    const banner = parseBanner(boda.banner);
    const previousUrl = getBannerUrl(banner);
    const url = await saveUploadedImage(file, `bodas/${boda.slug}`);

    await prisma.boda.update({
      where: { id: boda.id },
      data: {
        banner: {
          ...banner,
          image: { url },
        } satisfies Prisma.InputJsonObject,
        featuredImageUrl: url,
      },
    });

    if (previousUrl && previousUrl !== url) {
      await deleteLocalUpload(previousUrl);
    }

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/banner"]);
    return { success: "Banner subido correctamente." };
  } catch (err) {
    console.error("[uploadBannerFileAction]", err);
    return { error: getUploadErrorMessage(err) };
  }
}

export async function resetBannerToDefaultAction(
  _formData?: FormData,
): Promise<void> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    throw new Error(error ?? "No encontramos tu boda.");
  }

  const banner = parseBanner(boda.banner);
  const previousUrl = getBannerUrl(banner);
  if (!previousUrl) {
    return;
  }

  const restBanner = { ...banner };
  delete restBanner.image;
  const featuredMatchesBanner = boda.featuredImageUrl === previousUrl;

  await prisma.boda.update({
    where: { id: boda.id },
    data: {
      banner: restBanner as Prisma.InputJsonValue,
      ...(featuredMatchesBanner ? { featuredImageUrl: null } : {}),
    },
  });

  await deleteLocalUpload(previousUrl);
  revalidateBodaPaths(boda.slug, ["/mi-cuenta/banner"]);
}

export async function uploadGalleryFileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const file = formData.get("gallery_file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleccioná una imagen para la galería." };
  }

  const count = await prisma.picture.count({ where: { bodaId: boda.id } });
  if (!canAddPicture(boda.plan, count)) {
    return { error: pictureLimitError(boda.plan) };
  }

  try {
    const url = await saveUploadedImage(file, `bodas/${boda.slug}/gallery`);

    await prisma.picture.create({
      data: {
        bodaId: boda.id,
        url,
        sortOrder: count,
      },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/banner"]);
    return { success: "Imagen subida a la galería." };
  } catch (err) {
    console.error("[uploadGalleryFileAction]", err);
    return { error: getUploadErrorMessage(err) };
  }
}

export async function deletePictureAction(formData: FormData): Promise<void> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return;
  }

  const pictureId = String(formData.get("picture_id") ?? "");
  if (!pictureId) {
    return;
  }

  const picture = await prisma.picture.findFirst({
    where: { id: pictureId, bodaId: boda.id },
    select: { url: true },
  });

  if (!picture) {
    return;
  }

  await prisma.picture.deleteMany({
    where: { id: pictureId, bodaId: boda.id },
  });

  await deleteLocalUpload(picture.url);

  revalidateBodaPaths(boda.slug, ["/mi-cuenta/banner"]);
}
