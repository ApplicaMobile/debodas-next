"use client";

import { useActionState, useEffect, useState } from "react";
import { formatPrice } from "@/data/bodas";
import {
  addGiftAction,
  deleteGiftAction,
  updateGiftAction,
  updateGiftsListTitleAction,
} from "@/lib/account/actions/gifts";
import type { FormState } from "@/lib/account/form-state";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { FormAlert } from "@/components/account/FormAlert";
import { ConfirmDeleteForm } from "@/components/account/ConfirmDeleteForm";
import { PlanUsageMeter } from "@/components/account/PlanUsageMeter";
import { ImageFileInput } from "@/components/ui/ImageFileInput";
import { resolveGiftImageUrl } from "@/lib/gifts/image";
import {
  canAddGift,
  getPlanLimits,
  giftLimitMessage,
} from "@/lib/plans/limits";

interface GiftRow {
  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

interface GiftsPanelProps {
  listTitle: string;
  plan: string;
  gifts: GiftRow[];
}

const initialState: FormState = {};

function GiftEditor({
  gift,
  onCancel,
}: {
  gift: GiftRow;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateGiftAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      onCancel();
    }
    // Cerrar el editor al guardar; onCancel es setEditingId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form
      action={formAction}
      className="mt-3 space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4"
    >
      <input type="hidden" name="gift_id" value={gift.id} />
      <div className="grid gap-3 sm:grid-cols-4">
        <input
          name="title"
          required
          defaultValue={gift.title}
          className="rounded-xl border border-stone-200 bg-white px-4 py-3 sm:col-span-2"
          placeholder="Nombre del regalo"
        />
        <input
          name="price"
          type="number"
          min="0"
          required
          defaultValue={gift.price}
          className="rounded-xl border border-stone-200 bg-white px-4 py-3"
          placeholder="Precio"
        />
        <input
          name="quantity"
          type="number"
          min="1"
          defaultValue={gift.quantity}
          className="rounded-xl border border-stone-200 bg-white px-4 py-3"
          placeholder="Cant."
        />
        <input
          name="image_url"
          type="url"
          defaultValue={
            gift.imageUrl && !gift.imageUrl.startsWith("/assets/")
              ? gift.imageUrl
              : ""
          }
          className="rounded-xl border border-stone-200 bg-white px-4 py-3 sm:col-span-4"
          placeholder="URL de imagen (opcional)"
        />
      </div>
      <ImageFileInput
        name="image_file"
        label="Cambiar imagen"
        hint="JPG, PNG, WebP o GIF. Máximo 5 MB."
        variant="dropzone"
      />
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input type="checkbox" name="clear_image" value="1" />
        Quitar imagen (usar placeholder)
      </label>
      <FormAlert error={state.error} success={state.success} />
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function GiftsPanel({ listTitle, plan, gifts }: GiftsPanelProps) {
  const limits = getPlanLimits(plan);
  const atGiftLimit = !canAddGift(plan, gifts.length);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleState, titleAction, titlePending] = useActionState(
    updateGiftsListTitleAction,
    initialState,
  );
  const [addState, addAction, addPending] = useActionState(
    addGiftAction,
    initialState,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <form action={titleAction} className="space-y-4">
          <label className="block text-sm font-medium text-stone-700">
            Título de la sección
          </label>
          <input
            name="gifts_list_title"
            defaultValue={listTitle}
            className="w-full rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Lista de regalos"
          />
          <FormAlert error={titleState.error} success={titleState.success} />
          <button
            type="submit"
            disabled={titlePending}
            className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700"
          >
            Guardar título
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold text-stone-800">Regalos</h3>
        </div>
        <PlanUsageMeter
          label="regalos"
          current={gifts.length}
          max={limits.maxGifts}
        />
        {limits.maxGifts !== null ? (
          <p className="mt-1 text-xs text-stone-500">{giftLimitMessage(plan)}</p>
        ) : null}
        {gifts.length === 0 ? (
          <div className="mt-6">
            <AccountEmptyState
              title="Todavía no hay regalos en la lista"
              description="Agregá el primero con el formulario de abajo. Después configurá los métodos de pago y compartí el link."
              icon="★"
              actions={[
                {
                  label: "Agregar primer regalo",
                  href: "#agregar-regalo",
                  primary: true,
                },
                { label: "Métodos de pago", href: "/mi-cuenta/pagos" },
                { label: "Compartir / invitar", href: "/mi-cuenta/invitar" },
              ]}
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {gifts.map((gift) => (
              <li key={gift.id} className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveGiftImageUrl(gift.imageUrl)}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-stone-800">
                        {gift.title}
                      </p>
                      <p className="text-sm text-stone-500">
                        {formatPrice(gift.price)} · Cant: {gift.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingId((current) =>
                          current === gift.id ? null : gift.id,
                        )
                      }
                      className="text-sm font-medium text-[#e6dac7] hover:underline"
                    >
                      {editingId === gift.id ? "Cerrar" : "Editar"}
                    </button>
                    <ConfirmDeleteForm
                      action={deleteGiftAction}
                      message="¿Eliminar este regalo?"
                    >
                      <input type="hidden" name="gift_id" value={gift.id} />
                      <button
                        type="submit"
                        className="text-sm text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </ConfirmDeleteForm>
                  </div>
                </div>
                {editingId === gift.id ? (
                  <GiftEditor
                    gift={gift}
                    onCancel={() => setEditingId(null)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <form
          id="agregar-regalo"
          action={addAction}
          className="mt-6 scroll-mt-24 grid gap-3 sm:grid-cols-4"
        >
          <input
            name="title"
            className="rounded-xl border border-stone-200 px-4 py-3 sm:col-span-2"
            placeholder="Nombre del regalo"
            required
            disabled={atGiftLimit}
          />
          <input
            name="price"
            type="number"
            min="0"
            className="rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Precio"
            required
            disabled={atGiftLimit}
          />
          <input
            name="quantity"
            type="number"
            min="1"
            defaultValue="1"
            className="rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Cant."
            disabled={atGiftLimit}
          />
          <input
            name="image_url"
            type="url"
            className="rounded-xl border border-stone-200 px-4 py-3 sm:col-span-4"
            placeholder="URL de imagen (opcional)"
            disabled={atGiftLimit}
          />
          <div className="sm:col-span-4">
            <ImageFileInput
              name="image_file"
              label="O subir imagen"
              hint="JPG, PNG, WebP o GIF. Máximo 5 MB."
              variant="dropzone"
            />
          </div>
          <div className="sm:col-span-4">
            <FormAlert error={addState.error} success={addState.success} />
            <button
              type="submit"
              disabled={addPending || atGiftLimit}
              className="mt-2 w-full rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-60 sm:w-auto"
            >
              {atGiftLimit
                ? "Límite de regalos alcanzado"
                : addPending
                  ? "Agregando…"
                  : "Agregar regalo"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
