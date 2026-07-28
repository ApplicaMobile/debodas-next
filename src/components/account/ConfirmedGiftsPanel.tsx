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

function isImageVoucher(url: string): boolean {
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
}

function VoucherPreview({ url }: { url: string }) {
  if (isImageVoucher(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 block overflow-hidden rounded-xl border border-stone-200 bg-stone-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Comprobante de transferencia"
          className="max-h-48 w-full object-contain"
        />
        <p className="px-3 py-2 text-center text-xs font-medium text-[#6f5f47]">
          Ver comprobante en tamaño completo ↗
        </p>
      </a>
    );
  }

  return (
    <p className="mt-3 text-sm">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-medium text-[#6f5f47] underline"
      >
        Ver comprobante (PDF) ↗
      </a>
    </p>
  );
}

function ConfirmGiftButton({ giftId }: { giftId: string }) {
  const [state, formAction, isPending] = useActionState(
    confirmReceivedGiftAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="gift_id" value={giftId} />
      <FormAlert error={state.error} success={state.success} />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[#06263a] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Confirmando…" : "Acreditar regalo"}
      </button>
    </form>
  );
}

function GiftCard({ gift }: { gift: ConfirmedGiftRow }) {
  const pending = !gift.confirmed;

  return (
    <article
      className={`rounded-2xl border p-4 sm:rounded-3xl sm:p-6 ${
        pending
          ? "border-amber-200 bg-amber-50/40 shadow-sm"
          : "border-stone-100 bg-white shadow-sm"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-stone-800">{gift.participants}</p>
          <p className="mt-0.5 text-sm text-stone-600">
            {METHOD_LABELS[gift.method] ?? gift.method} ·{" "}
            {formatPrice(gift.amount)} {gift.currency}
          </p>
          <p className="text-xs text-stone-400">
            {new Date(gift.createdAt).toLocaleString("es-AR")}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            gift.confirmed
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-200 text-amber-950"
          }`}
        >
          {gift.confirmed ? "Acreditado" : "Revisar"}
        </span>
      </div>

      {gift.items.length > 0 ? (
        <ul className="mt-4 space-y-1 rounded-xl bg-white/80 px-3 py-2 text-sm text-stone-600">
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

      {gift.voucherUrl ? <VoucherPreview url={gift.voucherUrl} /> : null}

      {pending ? (
        <div className="mt-4 rounded-xl border border-amber-200/80 bg-white/70 px-3 py-2 text-xs text-amber-950">
          Revisá el comprobante (si hay) y acreditá el regalo para que quede
          registrado en tu lista.
        </div>
      ) : null}

      {pending ? <ConfirmGiftButton giftId={gift.id} /> : null}
    </article>
  );
}

export function ConfirmedGiftsPanel({ gifts }: ConfirmedGiftsPanelProps) {
  const pending = gifts.filter((g) => !g.confirmed);
  const confirmed = gifts.filter((g) => g.confirmed);

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
    <div className="space-y-8">
      {pending.length > 0 ? (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-stone-800">
                Pendientes de revisión
              </h3>
              <p className="mt-1 text-sm text-stone-600">
                {pending.length} regalo{pending.length === 1 ? "" : "s"} esperan
                tu confirmación.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {pending.map((gift) => <GiftCard key={gift.id} gift={gift} />)}
          </div>
        </section>
      ) : null}

      {confirmed.length > 0 ? (
        <section>
          <h3 className="text-lg font-semibold text-stone-800">
            {pending.length > 0 ? "Ya acreditados" : "Todos los regalos"}
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            {confirmed.length} regalo{confirmed.length === 1 ? "" : "s"}{" "}
            confirmado{confirmed.length === 1 ? "" : "s"}.
          </p>
          <div className="mt-4 space-y-4">
            {confirmed.map((gift) => <GiftCard key={gift.id} gift={gift} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
