"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/data/bodas";
import type { BodaGift } from "@/types/boda";
import type { PublicPaymentOptions } from "@/lib/bodas/payment-settings";
import { resolveGiftImageUrl } from "@/lib/gifts/image";
import { GIFT_MP_SURCHARGE_RATE, GIFT_PAYMENT_METHODS } from "@/lib/payments/constants";
import { GiftCheckoutModal } from "@/components/microsite/GiftCheckoutModal";
import { MicrositeSectionTitle } from "@/components/themes/ThemeSection";
import { useTranslations } from "@/components/i18n/LocaleProvider";

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
  hideList?: boolean;
  allowFreeAmount?: boolean;
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
  hideList = false,
  allowFreeAmount = false,
}: GiftSectionProps) {
  const t = useTranslations();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [freeAmount, setFreeAmount] = useState("");

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
          title: String(gift.title ?? t("microsite.giftDefault")),
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
  }

  function addFreeAmount() {
    const amount = Number(freeAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.giftId === "free-amount");
      if (existing) {
        return current.map((item) =>
          item.giftId === "free-amount" ? { ...item, unitPrice: amount } : item,
        );
      }
      return [
        ...current,
        {
          giftId: "free-amount",
          title: t("microsite.giftFreeTitle"),
          unitPrice: amount,
          quantity: 1,
        },
      ];
    });
    setCheckoutOpen(true);
  }

  return (
    <>
      <MicrositeSectionTitle className={titleClass ?? ""}>
        {giftsTitle}
      </MicrositeSectionTitle>

      {gifts.length === 0 && !allowFreeAmount ? (
        <p className="mt-8 text-center text-sm text-[var(--theme-text-muted)]">
          {t("microsite.giftEmpty")}
        </p>
      ) : (
        <>
          {hideList ? (
            <p className="mt-6 text-center text-sm text-[var(--theme-text-muted)]">
              {t("microsite.giftHidden")}
            </p>
          ) : null}

          {allowFreeAmount ? (
            <div className="mt-8 rounded-2xl border border-stone-200/80 bg-white/80 p-4 sm:flex sm:items-end sm:gap-3">
              <label className="block flex-1 text-sm font-medium text-stone-700">
                {t("microsite.giftFree")}
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={freeAmount}
                  onChange={(event) => setFreeAmount(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3"
                  placeholder={t("microsite.giftFreePlaceholder")}
                />
              </label>
              <button
                type="button"
                disabled={!paymentsEnabled}
                onClick={addFreeAmount}
                className="microsite-btn mt-3 sm:mt-0"
              >
                {t("microsite.giftFreeCta")}
              </button>
            </div>
          ) : null}
          {!paymentsEnabled ? (
            <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
              {t("microsite.giftNoPayments")}
            </p>
          ) : null}

          {!hideList && gifts.length > 0 ? (
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
                    alt={gift.title ?? t("microsite.giftDefault")}
                    className="microsite-gift-image"
                  />
                  <div className="microsite-gift-card__body">
                    <h3 className="text-lg font-semibold">{gift.title}</h3>
                    <p className="microsite-gift-price">
                      {formatPrice(gift.price ?? 0)}
                    </p>
                    {gift.quantity && Number(gift.quantity) > 1 ? (
                      <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                        {t("microsite.giftQty", { qty: String(gift.quantity) })}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={!paymentsEnabled || !gift.id}
                      onClick={() => addToCart(gift)}
                      className="microsite-btn mt-5 disabled:opacity-60"
                    >
                      {inCart ? t("microsite.giftAnother") : t("microsite.gift")}
                    </button>
                  </div>
                </article>
              );
            })}
            </div>
          ) : null}
        </>
      )}

      {cart.length > 0 ? (
        <>
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] backdrop-blur-sm md:hidden"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-stone-500">
                  {cart.length === 1
                    ? t("microsite.giftCount", { count: cart.length })
                    : t("microsite.giftCountPlural", { count: cart.length })}
                </p>
                <p className="text-lg font-semibold text-[var(--theme-accent)]">
                  {formatPrice(cartTotal)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="rounded-full border border-stone-300 px-3 py-2 text-xs font-medium"
                >
                  {t("microsite.giftClear")}
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(true)}
                  className="microsite-btn !px-5 !py-2.5 !text-sm"
                >
                  {t("microsite.giftContinue")}
                </button>
              </div>
            </div>
          </div>
          <div className="h-20 md:hidden" aria-hidden />

          <div
            className="microsite-card mt-8 hidden flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:flex"
          >
            <div>
              <p className="text-sm font-medium text-stone-700">
                {t("microsite.giftCountCart", { count: cart.length })}
              </p>
              <p className="text-lg font-semibold text-[var(--theme-accent)]">
                {t("microsite.giftSubtotal", { amount: formatPrice(cartTotal) })}
              </p>
              {paymentOptions.methods.includes(GIFT_PAYMENT_METHODS.MP_CHECKOUT) ? (
                <p className="text-xs text-[var(--theme-text-muted)]">
                  {t("microsite.giftMpSurcharge", {
                    rate: GIFT_MP_SURCHARGE_RATE * 100,
                  })}
                </p>
              ) : null}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCart([])}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm"
              >
                {t("microsite.giftClear")}
              </button>
              <button
                type="button"
                onClick={() => setCheckoutOpen(true)}
                className="microsite-btn"
              >
                {t("microsite.giftContinue")}
              </button>
            </div>
          </div>
        </>
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
