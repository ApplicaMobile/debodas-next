"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/data/bodas";
import { FormAlert } from "@/components/account/FormAlert";
import { ImageFileInput } from "@/components/ui/ImageFileInput";
import type { PublicPaymentOptions } from "@/lib/bodas/payment-settings";
import {
  createGiftCheckoutAction,
  submitGiftTransferAction,
  type GiftCheckoutState,
} from "@/lib/microsite/actions/gift-checkout";
import { GIFT_MP_SURCHARGE_RATE, GIFT_PAYMENT_METHODS } from "@/lib/payments/constants";

interface CartItem {
  giftId: string;
  title: string;
  unitPrice: number;
  quantity: number;
}

interface GiftCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  slug: string;
  cart: CartItem[];
  paymentOptions: PublicPaymentOptions;
  methodLabels: Record<string, string>;
  onRemoveItem: (giftId: string) => void;
}

const initialState: GiftCheckoutState = {};

function TransferInstructions({
  method,
  paymentOptions,
}: {
  method: string;
  paymentOptions: PublicPaymentOptions;
}) {
  if (method === GIFT_PAYMENT_METHODS.BANK_TRANSFER_ARS) {
    const account = paymentOptions.bank_account;
    return (
      <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-medium">Transferí a esta cuenta (ARS)</p>
        <p className="mt-2">Titular: {account?.owner || "—"}</p>
        <p>Banco: {account?.bank || "—"}</p>
        <p>CBU: {account?.cbu || "—"}</p>
        {account?.alias ? <p>Alias: {account.alias}</p> : null}
      </div>
    );
  }

  if (method === GIFT_PAYMENT_METHODS.BANK_TRANSFER_USD) {
    const account = paymentOptions.bank_account_usd;
    return (
      <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-medium">Transferí a esta cuenta (USD)</p>
        <p className="mt-2">Titular: {account?.owner || "—"}</p>
        <p>Banco: {account?.bank || "—"}</p>
        <p>CBU/CVU: {account?.cbu || "—"}</p>
      </div>
    );
  }

  if (method === GIFT_PAYMENT_METHODS.MP_TRANSFER) {
    const mp = paymentOptions.mp_alias_cvu;
    return (
      <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-medium">Transferí por Mercado Pago</p>
        <p className="mt-2">Titular: {mp?.owner_mp || "—"}</p>
        <p>Alias/CVU: {mp?.alias_cvu_mp || "—"}</p>
      </div>
    );
  }

  if (method === GIFT_PAYMENT_METHODS.PAYPAL) {
    const paypal = paymentOptions.paypal;
    return (
      <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-medium">Enviá por PayPal</p>
        <p className="mt-2">
          {paypal?.paypal_me
            ? `https://paypal.me/${paypal.paypal_me}`
            : "—"}
        </p>
        {paypal?.owner ? <p>A nombre de: {paypal.owner}</p> : null}
      </div>
    );
  }

  return null;
}

export function GiftCheckoutModal({
  open,
  onClose,
  onSuccess,
  slug,
  cart,
  paymentOptions,
  methodLabels,
  onRemoveItem,
}: GiftCheckoutModalProps) {
  const defaultMethod = paymentOptions.methods[0] ?? "";
  const [method, setMethod] = useState(defaultMethod);
  const [mpState, mpAction, mpPending] = useActionState(
    createGiftCheckoutAction,
    initialState,
  );
  const [transferState, transferAction, transferPending] = useActionState(
    submitGiftTransferAction,
    initialState,
  );

  const cartJson = useMemo(
    () =>
      JSON.stringify(
        cart.map((item) => ({
          giftId: item.giftId,
          quantity: item.quantity,
        })),
      ),
    [cart],
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const mpTotal = Math.round(subtotal * (1 + GIFT_MP_SURCHARGE_RATE) * 100) / 100;
  const isTransfer = method !== GIFT_PAYMENT_METHODS.MP_CHECKOUT;
  const state = isTransfer ? transferState : mpState;
  const formAction = isTransfer ? transferAction : mpAction;
  const isPending = isTransfer ? transferPending : mpPending;

  useEffect(() => {
    if (open) {
      setMethod(paymentOptions.methods[0] ?? "");
    }
  }, [open, paymentOptions.methods]);

  useEffect(() => {
    if (state.redirectTo) {
      onSuccess();
      window.location.href = state.redirectTo;
    }
  }, [state.redirectTo, onSuccess]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-stone-800">
              Confirmar regalo
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Completá tus datos y elegí cómo pagar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {cart.map((item) => (
            <div
              key={item.giftId}
              className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-stone-800">{item.title}</p>
                <p className="text-stone-500">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveItem(item.giftId)}
                className="text-xs text-red-600"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="boda_slug" value={slug} />
          <input type="hidden" name="cart_items" value={cartJson} />
          <input type="hidden" name="method" value={method} />

          <input
            name="participants"
            required
            minLength={2}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-800"
            placeholder="Participantes (quién/es regala/n)"
          />
          <input
            name="email"
            type="email"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-800"
            placeholder="Email (opcional)"
          />
          <input
            name="phone"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-800"
            placeholder="Teléfono (opcional)"
          />
          <textarea
            name="dedication"
            rows={3}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-800"
            placeholder="Dedicatoria (opcional)"
          />

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-stone-700">
              Método de pago
            </legend>
            {paymentOptions.methods.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 text-sm text-stone-700"
              >
                <input
                  type="radio"
                  name="method_choice"
                  value={option}
                  checked={method === option}
                  onChange={() => setMethod(option)}
                />
                {methodLabels[option] ?? option}
              </label>
            ))}
          </fieldset>

          {isTransfer ? (
            <>
              <TransferInstructions method={method} paymentOptions={paymentOptions} />
              <ImageFileInput
                name="voucher"
                label="Comprobante (opcional)"
                hint="JPG, PNG, WebP o PDF. Máximo 5 MB."
                accept="image/jpeg,image/png,image/webp,application/pdf"
                variant="dropzone"
              />
            </>
          ) : (
            <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-700">
              <p>Subtotal: {formatPrice(subtotal)}</p>
              <p>
                Recargo Mercado Pago ({GIFT_MP_SURCHARGE_RATE * 100}%):{" "}
                {formatPrice(mpTotal - subtotal)}
              </p>
              <p className="mt-1 font-semibold">Total: {formatPrice(mpTotal)}</p>
            </div>
          )}

          <FormAlert error={state.error} success={state.success} />

          <button
            type="submit"
            disabled={isPending || cart.length === 0 || !method}
            className="microsite-btn w-full disabled:opacity-60"
          >
            {isPending
              ? "Procesando…"
              : isTransfer
                ? "Enviar regalo"
                : "Pagar con Mercado Pago"}
          </button>
        </form>
      </div>
    </div>
  );
}
