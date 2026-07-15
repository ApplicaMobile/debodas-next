export const GIFT_MP_SURCHARGE_RATE = 0.06;

export const GIFT_PAYMENT_METHODS = {
  MP_CHECKOUT: "mp_checkout",
  MP_TRANSFER: "mp_transfer",
  BANK_TRANSFER_ARS: "bank_transfer_ars",
  BANK_TRANSFER_USD: "bank_transfer_usd",
  PAYPAL: "paypal",
} as const;

export type GiftPaymentMethod =
  (typeof GIFT_PAYMENT_METHODS)[keyof typeof GIFT_PAYMENT_METHODS];
