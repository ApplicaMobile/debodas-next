import { GIFT_MP_SURCHARGE_RATE } from "@/lib/payments/constants";

export interface GiftCartLine {
  giftId: string;
  title: string;
  unitPrice: number;
  quantity: number;
}

export function applyMpSurcharge(amount: number): number {
  return Math.round(amount * (1 + GIFT_MP_SURCHARGE_RATE) * 100) / 100;
}

export function calculateGiftSubtotal(items: GiftCartLine[]): number {
  return items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );
}

export function calculateMpCheckoutTotal(items: GiftCartLine[]): {
  subtotal: number;
  surcharge: number;
  total: number;
} {
  const subtotal = calculateGiftSubtotal(items);
  const total = applyMpSurcharge(subtotal);
  const surcharge = Math.round((total - subtotal) * 100) / 100;

  return { subtotal, surcharge, total };
}
