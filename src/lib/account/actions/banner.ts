"use server";

import { requireOwnedBoda } from "@/lib/account/auth-boda";
import type { FormState } from "@/lib/account/form-state";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import { prisma } from "@/lib/db/prisma";
import {
  deleteLocalUpload,
  getUploadErrorMessage,
  saveUploadedImage,
} from "@/lib/upload/local";

function parseBanner(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function getBannerUrl(banner: Record<string, unknown>): string {
  const image = banner.image;
  if (image && typeof image === "object" && "url" in image) {
    return String((image as { url?: string }).url ?? "");
  }
  return "";
}

export async function updateBannerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const bannerUrl = String(formData.get("banner_url") ?? "").trim();
  const featuredUrl = String(formData.get("featured_url") ?? "").trim();
  const banner = parseBanner(boda.banner);

  const image = bannerUrl.length > 0 ? { url: bannerUrl } : undefined;

  const nextBanner = {
    ...banner,
    ...(image ? { image } : { image: undefined }),
  };

  try {
    await prisma.boda.update({
      where: { id: boda.id },
      data: {
        banner: nextBanner,
        featuredImageUrl: featuredUrl || null,
      },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/banner"]);
    return { success: "Banner actualizado." };
  } catch (err) {
    console.error("[updateBannerAction]", err);
    return { error: "No se pudo guardar el banner." };
  }
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
        },
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

export async function addPictureAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const url = String(formData.get("url") ?? "").trim();
  if (!url) {
    return { error: "Ingresá la URL de la imagen." };
  }

  const count = await prisma.picture.count({ where: { bodaId: boda.id } });

  try {
    await prisma.picture.create({
      data: {
        bodaId: boda.id,
        url,
        sortOrder: count,
      },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/banner"]);
    return { success: "Imagen agregada a la galería." };
  } catch (err) {
    console.error("[addPictureAction]", err);
    return { error: "No se pudo agregar la imagen." };
  }
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
