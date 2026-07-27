"use client";

import { useActionState } from "react";
import { formatPrice } from "@/data/bodas";
import { confirmReceivedGiftAction } from "@/lib/microsite/actions/gift-checkout";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { FormAlert } from "@/components/account/FormAlert";

interface ConfirmedGiftRow {
  id: string;
  participants: string;
  email: string | null;
  phone: string | null;
  dedication: string | null;
  method: string;
  amount: number;
  currency: string;
  confirmed: boolean;
  voucherUrl: string | null;
  createdAt: string;
  items: Array<{
    title?: string;
    quantity?: number;
    unitPrice?: number;
  }>;
}

interface ConfirmedGiftsPanelProps {
  gifts: ConfirmedGiftRow[];
}

const METHOD_LABELS: Record<string, string> = {
  mp_checkout: "Mercado Pago",
  mp_transfer: "Transferencia MP",
  bank_transfer_ars: "Transferencia ARS",
  bank_transfer_usd: "Transferencia USD",
  paypal: "PayPal",
};

const initialState: { error?: string; success?: string } = {};

function ConfirmGiftButton({ giftId }: { giftId: string }) {
  const [state, formAction, isPending] = useActionState(
    confirmReceivedGiftAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="gift_id" value={giftId} />
      <FormAlert error={state.error} success={state.success} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[#e6dac7] px-4 py-2 text-xs font-semibold text-stone-800"
      >
        {isPending ? "Confirmando…" : "Marcar como confirmado"}
      </button>
    </form>
  );
}

export function ConfirmedGiftsPanel({ gifts }: ConfirmedGiftsPanelProps) {
  if (gifts.length === 0) {
    return (
      <AccountEmptyState
        title="Todavía no recibiste regalos"
        description="Cuando un invitado complete un regalo, va a aparecer acá."
        actions={[
          {
            label: "Armar lista de regalos",
            href: "/mi-cuenta/regalos",
            primary: true,
          },
          { label: "Compartir / invitar", href: "/mi-cuenta/invitar" },
        ]}
      />
    );
  }

  return (
    <div className="space-y-4">
      {gifts.map((gift) => (
        <article
          key={gift.id}
          className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-stone-800">{gift.participants}</p>
              <p className="text-sm text-stone-500">
                {METHOD_LABELS[gift.method] ?? gift.method} ·{" "}
                {formatPrice(gift.amount)} {gift.currency}
              </p>
              <p className="text-xs text-stone-400">
                {new Date(gift.createdAt).toLocaleString("es-AR")}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                gift.confirmed
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {gift.confirmed ? "Confirmado" : "Pendiente"}
            </span>
          </div>

          {gift.items.length > 0 ? (
            <ul className="mt-4 space-y-1 text-sm text-stone-600">
              {gift.items.map((item, index) => (
                <li key={`${gift.id}-${index}`}>
                  {item.quantity ?? 1} × {item.title ?? "Regalo"} —{" "}
                  {formatPrice(item.unitPrice ?? 0)}
                </li>
              ))}
            </ul>
          ) : null}

          {gift.dedication ? (
            <p className="mt-3 text-sm italic text-stone-600">
              “{gift.dedication}”
            </p>
          ) : null}

          {(gift.email || gift.phone) && (
            <p className="mt-2 text-xs text-stone-500">
              {[gift.email, gift.phone].filter(Boolean).join(" · ")}
            </p>
          )}

          {gift.voucherUrl ? (
            <p className="mt-3 text-sm">
              <a
                href={gift.voucherUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#e6dac7] underline"
              >
                Ver comprobante
              </a>
            </p>
          ) : null}

          {!gift.confirmed ? <ConfirmGiftButton giftId={gift.id} /> : null}
        </article>
      ))}
    </div>
  );
}
