"use client";

import { useActionState } from "react";
import {
  deletePictureAction,
  resetBannerToDefaultAction,
  uploadBannerFileAction,
  uploadGalleryFileAction,
} from "@/lib/account/actions/banner";
import type { FormState } from "@/lib/account/form-state";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { FormAlert } from "@/components/account/FormAlert";
import { ConfirmDeleteForm } from "@/components/account/ConfirmDeleteForm";
import { BannerCropInput } from "@/components/account/BannerCropInput";
import { ImageFileInput } from "@/components/ui/ImageFileInput";
import { PlanUsageMeter } from "@/components/account/PlanUsageMeter";
import {
  canAddPicture,
  getPlanLimits,
  pictureLimitMessage,
} from "@/lib/plans/limits";

/** Misma imagen que WP cuando la pareja todavía no subió banner. */
export const DEFAULT_BANNER_IMAGE_URL =
  "/assets/img/themes/banner_wedding_placeholder.png";

interface BannerPanelProps {
  bannerUrl: string;
  plan: string;
  pictures: Array<{ id: string; url: string; alt: string | null }>;
}

const initialState: FormState = {};

export function BannerPanel({
  bannerUrl,
  plan,
  pictures,
}: BannerPanelProps) {
  const limits = getPlanLimits(plan);
  const atPictureLimit = !canAddPicture(plan, pictures.length);
  const hasCustomBanner = Boolean(bannerUrl);
  const previewUrl = hasCustomBanner ? bannerUrl : DEFAULT_BANNER_IMAGE_URL;
  const [uploadBannerState, uploadBannerAction, uploadBannerPending] =
    useActionState(uploadBannerFileAction, initialState);
  const [uploadGalleryState, uploadGalleryAction, uploadGalleryPending] =
    useActionState(uploadGalleryFileAction, initialState);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h3 className="text-lg font-semibold text-stone-800">
          Imagen del banner
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          Es la primera imagen que ven tus invitados. Subí una foto horizontal.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-100 bg-stone-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={
              hasCustomBanner
                ? "Vista previa del banner"
                : "Imagen por defecto del banner"
            }
            className="max-h-56 w-full object-cover"
          />
          <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-stone-500">
              {hasCustomBanner
                ? "Banner actual. Elegí otra foto abajo para reemplazarlo."
                : "Imagen por defecto. Se usa hasta que subas una foto."}
            </p>
            {hasCustomBanner ? (
              <ConfirmDeleteForm
                action={resetBannerToDefaultAction}
                message="¿Quitar tu foto y volver a la imagen por defecto?"
                successMessage="Volviste a la imagen por defecto."
                className="shrink-0"
              >
                <button
                  type="submit"
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 hover:underline"
                >
                  Volver a la imagen por defecto
                </button>
              </ConfirmDeleteForm>
            ) : null}
          </div>
        </div>

        <form
          id="subir-banner"
          action={uploadBannerAction}
          className="mt-6 space-y-4"
        >
          <BannerCropInput
            name="banner_file"
            label="Cambiar banner"
            hint="JPG, PNG, WebP o GIF. Máximo 5 MB. Recorte 1400×500. Comprobá que se vea centrada en el celular."
          />
          <FormAlert
            error={uploadBannerState.error}
            success={uploadBannerState.success}
          />
          <button
            type="submit"
            disabled={uploadBannerPending}
            className="w-full rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-60 sm:w-auto"
          >
            {uploadBannerPending
              ? "Subiendo…"
              : hasCustomBanner
                ? "Guardar banner"
                : "Subir banner"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h3 className="text-lg font-semibold text-stone-800">Galería</h3>
        <p className="mt-1 text-sm text-stone-500">
          Fotos que se muestran en el micrositio.
        </p>
        <div className="mt-4">
          <PlanUsageMeter
            label="fotos"
            current={pictures.length}
            max={limits.maxPictures}
          />
          {limits.maxPictures !== null ? (
            <p className="mt-1 text-xs text-stone-500">
              {pictureLimitMessage(plan)}
            </p>
          ) : null}
        </div>

        {pictures.length === 0 ? (
          <div className="mt-4">
            <AccountEmptyState
              title="Todavía no hay fotos en la galería"
              description="Elegí una imagen abajo y subila para que tus invitados vean más de ustedes."
            />
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {pictures.map((picture) => (
              <li
                key={picture.id}
                className="overflow-hidden rounded-xl border border-stone-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={picture.url}
                  alt={picture.alt ?? ""}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <p className="min-w-0 flex-1 truncate text-xs text-stone-500">
                    {picture.alt || picture.url}
                  </p>
                  <ConfirmDeleteForm
                    action={deletePictureAction}
                    message="¿Eliminar esta imagen de la galería?"
                  >
                    <input type="hidden" name="picture_id" value={picture.id} />
                    <button
                      type="submit"
                      className="shrink-0 text-sm text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </ConfirmDeleteForm>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form
          id="agregar-galeria"
          action={uploadGalleryAction}
          className="mt-6 scroll-mt-24 space-y-4 border-t border-stone-100 pt-6"
        >
          <ImageFileInput
            name="gallery_file"
            label="Subir a la galería"
            hint="JPG, PNG, WebP o GIF. Máximo 5 MB."
          />
          <FormAlert
            error={uploadGalleryState.error}
            success={uploadGalleryState.success}
          />
          <button
            type="submit"
            disabled={uploadGalleryPending || atPictureLimit}
            className="w-full rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-60 sm:w-auto"
          >
            {atPictureLimit
              ? "Límite de fotos alcanzado"
              : uploadGalleryPending
                ? "Subiendo…"
                : "Subir imagen"}
          </button>
        </form>
      </section>
    </div>
  );
}
