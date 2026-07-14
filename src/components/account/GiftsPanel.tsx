"use client";

import { useActionState } from "react";
import { formatPrice } from "@/data/bodas";
import {
  addGiftAction,
  deleteGiftAction,
  updateGiftsListTitleAction,
} from "@/lib/account/actions/gifts";
import type { FormState } from "@/lib/account/form-state";
import { FormAlert } from "@/components/account/FormAlert";
import {
  canAddGift,
  formatPlanLimit,
  getPlanLimits,
  giftLimitMessage,
} from "@/lib/plans/limits";

interface GiftsPanelProps {
  listTitle: string;
  plan: string;
  gifts: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
  }>;
}

const initialState: FormState = {};

export function GiftsPanel({ listTitle, plan, gifts }: GiftsPanelProps) {
  const limits = getPlanLimits(plan);
  const atGiftLimit = !canAddGift(plan, gifts.length);
  const giftLimitLabel =
    limits.maxGifts === null
      ? `${gifts.length} regalos`
      : `${gifts.length} / ${formatPlanLimit(limits.maxGifts)} regalos`;

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
      <section className="rounded-3xl bg-white p-8 shadow-sm">
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

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold text-stone-800">Regalos</h3>
          <p className="text-sm text-stone-500">{giftLimitLabel}</p>
        </div>
        {limits.maxGifts !== null ? (
          <p className="mt-1 text-xs text-stone-500">{giftLimitMessage(plan)}</p>
        ) : null}
        <ul className="mt-4 divide-y divide-stone-100">
          {gifts.map((gift) => (
            <li
              key={gift.id}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div>
                <p className="font-medium text-stone-800">{gift.title}</p>
                <p className="text-sm text-stone-500">
                  {formatPrice(gift.price)} · Cant: {gift.quantity}
                </p>
              </div>
              <form action={deleteGiftAction}>
                <input type="hidden" name="gift_id" value={gift.id} />
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>

        <form action={addAction} className="mt-6 grid gap-3 sm:grid-cols-4">
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
          <div className="sm:col-span-4">
            <FormAlert error={addState.error} success={addState.success} />
            <button
              type="submit"
              disabled={addPending || atGiftLimit}
              className="mt-2 rounded-full bg-[#556B2F] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
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
