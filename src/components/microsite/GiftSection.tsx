"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/data/bodas";
import type { BodaGift } from "@/types/boda";
import type { PublicPaymentOptions } from "@/lib/bodas/payment-settings";
import { resolveGiftImageUrl } from "@/lib/gifts/image";
import { GIFT_MP_SURCHARGE_RATE, GIFT_PAYMENT_METHODS } from "@/lib/payments/constants";
import { GiftCheckoutModal } from "@/components/microsite/GiftCheckoutModal";
import { MicrositeSectionTitle } from "@/components/themes/ThemeSection";

interface CartItem {
  giftId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
}

interface GiftSectionProps {
  slug: string;
  giftsTitle: string;
  gifts: BodaGift[];
  paymentOptions: PublicPaymentOptions;
  titleClass?: string;
}

const METHOD_LABELS: Record<string, string> = {
  bank_transfer_ars: "Transferencia bancaria (ARS)",
  bank_transfer_usd: "Transferencia bancaria (USD)",
  mp_transfer: "Transferencia Mercado Pago",
  mp_checkout: "Pagar con Mercado Pago (+6%)",
  paypal: "PayPal",
};

export function GiftSection({
  slug,
  giftsTitle,
  gifts,
  paymentOptions,
  titleClass,
}: GiftSectionProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart],
  );

  const paymentsEnabled = paymentOptions.methods.length > 0;

  function addToCart(gift: BodaGift) {
    if (!gift.id) {
      return;
    }

    const unitPrice = Number(gift.price ?? 0);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return;
    }

    const imageUrl =
      gift.image && typeof gift.image === "object" && "url" in gift.image
        ? String(gift.image.url ?? "")
        : undefined;

    setCart((current) => {
      const existing = current.find((item) => item.giftId === gift.id);
      if (existing) {
        return current.map((item) =>
          item.giftId === gift.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...current,
        {
          giftId: gift.id!,
          title: String(gift.title ?? "Regalo"),
          unitPrice,
          quantity: 1,
          imageUrl,
        },
      ];
    });
  }

  function removeFromCart(giftId: string) {
    setCart((current) => current.filter((item) => item.giftId !== giftId));
  }

  function clearCart() {
    setCart([]);
    setCheckoutOpen(false);
  }

  return (
    <>
      <MicrositeSectionTitle className={titleClass ?? ""}>
        {giftsTitle}
      </MicrositeSectionTitle>

      {gifts.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[var(--theme-text-muted)]">
          La pareja aún no cargó regalos en su lista.
        </p>
      ) : (
        <>
          {!paymentsEnabled ? (
            <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
              Los regalos se muestran como referencia. La pareja aún no configuró
              métodos de pago.
            </p>
          ) : null}

          <div className="microsite-gift-grid mt-10">
            {gifts.map((gift, index) => {
              const imageUrl =
                gift.image &&
                typeof gift.image === "object" &&
                "url" in gift.image
                  ? String(gift.image.url ?? "")
                  : "";
              const displayImage = resolveGiftImageUrl(imageUrl);

              const inCart = cart.some((item) => item.giftId === gift.id);

              return (
                <article
                  key={gift.id ?? `${gift.title}-${index}`}
                  className="microsite-card microsite-gift-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayImage}
                    alt={gift.title ?? "Regalo"}
                    className="microsite-gift-image"
                  />
                  <div className="microsite-gift-card__body">
                    <h3 className="text-lg font-semibold">{gift.title}</h3>
                    <p className="microsite-gift-price">
                      {formatPrice(gift.price ?? 0)}
                    </p>
                    {gift.quantity && Number(gift.quantity) > 1 ? (
                      <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                        Cantidad sugerida: {gift.quantity}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={!paymentsEnabled || !gift.id}
                      onClick={() => addToCart(gift)}
                      className="microsite-btn mt-5 disabled:opacity-60"
                    >
                      {inCart ? "Agregar otro" : "Regalar"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {cart.length > 0 ? (
        <div className="microsite-card mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-stone-700">
              {cart.length} regalo{cart.length === 1 ? "" : "s"} en el carrito
            </p>
            <p className="text-lg font-semibold text-[var(--theme-accent)]">
              Subtotal: {formatPrice(cartTotal)}
            </p>
            {paymentOptions.methods.includes(GIFT_PAYMENT_METHODS.MP_CHECKOUT) ? (
              <p className="text-xs text-[var(--theme-text-muted)]">
                Mercado Pago incluye recargo del {GIFT_MP_SURCHARGE_RATE * 100}%
              </p>
            ) : null}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCart([])}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm"
            >
              Vaciar
            </button>
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="microsite-btn"
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}

      <GiftCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={clearCart}
        slug={slug}
        cart={cart}
        paymentOptions={paymentOptions}
        methodLabels={METHOD_LABELS}
        onRemoveItem={removeFromCart}
      />
    </>
  );
}
