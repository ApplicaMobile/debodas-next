"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatPrice } from "@/data/bodas";
import { FormAlert } from "@/components/account/FormAlert";
import { ImageFileInput } from "@/components/ui/ImageFileInput";
import { HoneypotField } from "@/components/ui/HoneypotField";
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
  const activeMethod = paymentOptions.methods.includes(method)
    ? method
    : defaultMethod;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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
  const isTransfer = activeMethod !== GIFT_PAYMENT_METHODS.MP_CHECKOUT;
  const state = isTransfer ? transferState : mpState;
  const formAction = isTransfer ? transferAction : mpAction;
  const isPending = isTransfer ? transferPending : mpPending;

  useEffect(() => {
    if (!open) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open, onClose]);

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
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-checkout-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="gift-checkout-title"
              className="text-xl font-semibold text-stone-800"
            >
              Confirmar regalo
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Completá tus datos y elegí cómo pagar.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full px-4 py-2 text-sm text-stone-600 hover:bg-stone-100"
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
                className="min-h-11 rounded-lg px-3 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        <form
          action={formAction}
          aria-busy={isPending}
          className="mt-6 space-y-4"
        >
          <input type="hidden" name="boda_slug" value={slug} />
          <input type="hidden" name="cart_items" value={cartJson} />
          <input type="hidden" name="method" value={activeMethod} />
          <HoneypotField id="gift-website" />

          <label
            htmlFor="gift-participants"
            className="block text-sm font-medium text-stone-700"
          >
            Participantes
          </label>
          <input
            id="gift-participants"
            name="participants"
            required
            minLength={2}
            maxLength={200}
            autoComplete="name"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-800"
            placeholder="Quién/es regala/n"
          />
          <label
            htmlFor="gift-email"
            className="block text-sm font-medium text-stone-700"
          >
            Email (opcional)
          </label>
          <input
            id="gift-email"
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-800"
            placeholder="tu@email.com"
          />
          <label
            htmlFor="gift-phone"
            className="block text-sm font-medium text-stone-700"
          >
            Teléfono (opcional)
          </label>
          <input
            id="gift-phone"
            name="phone"
            type="tel"
            maxLength={40}
            autoComplete="tel"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-800"
            placeholder="Tu teléfono"
          />
          <label
            htmlFor="gift-dedication"
            className="block text-sm font-medium text-stone-700"
          >
            Dedicatoria (opcional)
          </label>
          <textarea
            id="gift-dedication"
            name="dedication"
            rows={3}
            maxLength={1000}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-800"
            placeholder="Mensaje para los novios"
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
                  checked={activeMethod === option}
                  onChange={() => setMethod(option)}
                />
                {methodLabels[option] ?? option}
              </label>
            ))}
          </fieldset>

          {isTransfer ? (
            <>
              <TransferInstructions
                method={activeMethod}
                paymentOptions={paymentOptions}
              />
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
            disabled={isPending || cart.length === 0 || !activeMethod}
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
