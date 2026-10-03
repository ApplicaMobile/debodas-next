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
import {
  AccountDeleteButton,
  AccountFormActions,
  AccountSection,
} from "@/components/account/AccountPage";
import { IllustrationPhotos } from "@/components/account/AccountIllustrations";
import { Badge, Button, UsageMeter } from "@/components/ui";
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
    <>
      <AccountSection
        id="banner-imagen"
        title="Imagen de portada"
        description="Es la primera imagen que ven tus invitados. Subí una foto horizontal."
        badge={
          hasCustomBanner ? (
            <Badge tone="aprobado">Foto propia</Badge>
          ) : (
            <Badge tone="neutro">Imagen por defecto</Badge>
          )
        }
      >
        <figure className="overflow-hidden rounded-md border border-border-subtle bg-surface-muted">
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
          <figcaption className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="type-body-sm text-text-secondary">
              {hasCustomBanner
                ? "Banner actual. Elegí otra foto abajo para reemplazarlo."
                : "Imagen por defecto. Se usa hasta que subas una foto."}
            </span>
            {hasCustomBanner ? (
              <ConfirmDeleteForm
                action={resetBannerToDefaultAction}
                message="¿Quitar tu foto y volver a la imagen por defecto?"
                successMessage="Volviste a la imagen por defecto."
                className="shrink-0"
              >
                <Button type="submit" variant="fantasma" size="sm">
                  Volver a la imagen por defecto
                </Button>
              </ConfirmDeleteForm>
            ) : null}
          </figcaption>
        </figure>

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
          <AccountFormActions
            alert={
              <FormAlert
                error={uploadBannerState.error}
                success={uploadBannerState.success}
              />
            }
          >
            <Button
              type="submit"
              loading={uploadBannerPending}
              loadingLabel="Subiendo…"
            >
              {hasCustomBanner ? "Guardar banner" : "Subir banner"}
            </Button>
          </AccountFormActions>
        </form>
      </AccountSection>

      <AccountSection
        id="banner-galeria"
        title="Galería"
        description="Fotos que se muestran en el micrositio."
        badge={
          <Badge tone="neutro" icon={false}>
            {pictures.length} {pictures.length === 1 ? "foto" : "fotos"}
          </Badge>
        }
      >
        <div className="max-w-md">
          <UsageMeter
            label="Fotos de la galería"
            value={pictures.length}
            max={limits.maxPictures}
            unit="fotos"
            upgradeHref="/mi-cuenta/plan"
          />
          {limits.maxPictures !== null ? (
            <p className="mt-1 type-caption text-text-secondary">
              {pictureLimitMessage(plan)}
            </p>
          ) : null}
        </div>

        {pictures.length === 0 ? (
          <div className="mt-6">
            <AccountEmptyState
              illustration={IllustrationPhotos}
              title="Todavía no hay fotos en la galería"
              description="Elegí una imagen abajo y subila para que tus invitados vean más de ustedes."
            />
          </div>
        ) : (
          <ul
            role="list"
            className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {pictures.map((picture) => (
              <li
                key={picture.id}
                className="overflow-hidden rounded-md border border-border-subtle bg-surface-default"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={picture.url}
                  alt={picture.alt ?? ""}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <p className="min-w-0 flex-1 truncate type-caption text-text-secondary">
                    {picture.alt || picture.url}
                  </p>
                  <ConfirmDeleteForm
                    action={deletePictureAction}
                    message="¿Eliminar esta imagen de la galería?"
                  >
                    <input type="hidden" name="picture_id" value={picture.id} />
                    <AccountDeleteButton />
                  </ConfirmDeleteForm>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form
          id="agregar-galeria"
          action={uploadGalleryAction}
          className="mt-8 scroll-mt-24 space-y-4 border-t border-border-subtle pt-6"
        >
          <ImageFileInput
            name="gallery_file"
            label="Subir a la galería"
            hint="JPG, PNG, WebP o GIF. Máximo 5 MB."
          />
          <AccountFormActions
            alert={
              <FormAlert
                error={uploadGalleryState.error}
                success={uploadGalleryState.success}
              />
            }
          >
            <Button
              type="submit"
              disabled={atPictureLimit}
              loading={uploadGalleryPending}
              loadingLabel="Subiendo…"
            >
              {atPictureLimit ? "Límite de fotos alcanzado" : "Subir imagen"}
            </Button>
          </AccountFormActions>
        </form>
      </AccountSection>
    </>
  );
}
