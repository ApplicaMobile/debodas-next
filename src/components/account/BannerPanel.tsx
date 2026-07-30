"use client";

import { useActionState } from "react";
import {
  addPictureAction,
  deletePictureAction,
  updateBannerAction,
  uploadBannerFileAction,
  uploadGalleryFileAction,
} from "@/lib/account/actions/banner";
import type { FormState } from "@/lib/account/form-state";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { FormAlert } from "@/components/account/FormAlert";
import { ConfirmDeleteForm } from "@/components/account/ConfirmDeleteForm";
import { ImageFileInput } from "@/components/ui/ImageFileInput";

interface BannerPanelProps {
  bannerUrl: string;
  featuredUrl: string;
  pictures: Array<{ id: string; url: string; alt: string | null }>;
}

const initialState: FormState = {};

export function BannerPanel({
  bannerUrl,
  featuredUrl,
  pictures,
}: BannerPanelProps) {
  const [bannerState, bannerAction, bannerPending] = useActionState(
    updateBannerAction,
    initialState,
  );
  const [uploadBannerState, uploadBannerAction, uploadBannerPending] =
    useActionState(uploadBannerFileAction, initialState);
  const [addState, addAction, addPending] = useActionState(
    addPictureAction,
    initialState,
  );
  const [uploadGalleryState, uploadGalleryAction, uploadGalleryPending] =
    useActionState(uploadGalleryFileAction, initialState);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h3 className="text-lg font-semibold text-stone-800">
          Imagen del banner
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          Subí una foto o pegá la URL del encabezado del micrositio.
        </p>

        <div className="mt-6">
          {bannerUrl ? (
            <div className="overflow-hidden rounded-2xl border border-stone-100 bg-stone-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerUrl}
                alt="Vista previa del banner"
                className="max-h-56 w-full object-cover"
              />
              <p className="truncate px-3 py-2 text-xs text-stone-500">
                {bannerUrl}
              </p>
            </div>
          ) : (
            <AccountEmptyState
              title="Todavía no hay banner"
              description="Es la primera imagen que ven tus invitados. Subí una foto horizontal o pegá una URL."
              actions={[
                {
                  label: "Subir banner",
                  href: "#subir-banner",
                  primary: true,
                },
              ]}
            />
          )}
        </div>

        <form
          id="subir-banner"
          action={uploadBannerAction}
          className="mt-6 scroll-mt-28 space-y-4"
        >
          <ImageFileInput
            name="banner_file"
            label="Subir banner"
            hint="JPG, PNG, WebP o GIF. Máximo 5 MB."
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
            {uploadBannerPending ? "Subiendo…" : "Subir banner"}
          </button>
        </form>

        <form action={bannerAction} className="mt-8 space-y-4 border-t border-stone-100 pt-8">
          <p className="text-sm font-medium text-stone-700">
            O usar URL externa
          </p>
          <input
            name="banner_url"
            defaultValue={bannerUrl}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm"
            placeholder="https://..."
          />
          <input
            name="featured_url"
            defaultValue={featuredUrl}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm"
            placeholder="URL imagen destacada (opcional)"
          />
          <FormAlert
            error={bannerState.error}
            success={bannerState.success}
          />
          <button
            type="submit"
            disabled={bannerPending}
            className="w-full rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 disabled:opacity-60 sm:w-auto"
          >
            {bannerPending ? "Guardando…" : "Guardar URLs"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h3 className="text-lg font-semibold text-stone-800">Galería</h3>
        <p className="mt-1 text-sm text-stone-500">
          Fotos que se muestran en el micrositio.
        </p>

        {pictures.length === 0 ? (
          <div className="mt-4">
            <AccountEmptyState
              title="Todavía no hay fotos en la galería"
              description="Subí la primera imagen para que tus invitados vean más de ustedes."
              actions={[
                {
                  label: "Subir primera foto",
                  href: "#agregar-galeria",
                  primary: true,
                },
              ]}
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
            disabled={uploadGalleryPending}
            className="w-full rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-60 sm:w-auto"
          >
            {uploadGalleryPending ? "Subiendo…" : "Subir imagen"}
          </button>
        </form>

        <form action={addAction} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            name="url"
            className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm"
            placeholder="URL de nueva imagen"
          />
          <button
            type="submit"
            disabled={addPending}
            className="w-full rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 disabled:opacity-60 sm:w-auto"
          >
            {addPending ? "Agregando…" : "Agregar URL"}
          </button>
        </form>
        <div className="mt-3">
          <FormAlert error={addState.error} success={addState.success} />
        </div>
      </section>
    </div>
  );
}
