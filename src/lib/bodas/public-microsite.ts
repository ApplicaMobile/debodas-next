import type { Boda, BodaOptions } from "@/types/boda";
import {
  getPaymentSettings,
  getPublicPaymentOptions,
  type PublicPaymentOptions,
} from "@/lib/bodas/payment-settings";

/**
 * Payload seguro para el Client Component del micrositio.
 * - Quita `options.password` (no debe viajar al browser).
 * - Quita `misc.payment_settings.mp_tokens` (access_token cifrado / public_key).
 * - Calcula `paymentOptions` en server (hasMpCheckout usa decrypt).
 */
export function buildPublicMicrositePayload(boda: Boda): {
  boda: Boda;
  paymentOptions: PublicPaymentOptions;
} {
  const plan = String(boda.plan ?? "free");
  const misc =
    boda.misc && typeof boda.misc === "object" && !Array.isArray(boda.misc)
      ? ({ ...boda.misc } as Record<string, unknown>)
      : {};

  const paymentSettings = getPaymentSettings(misc);
  const paymentOptions = getPublicPaymentOptions(paymentSettings, plan);

  const safePaymentSettings = { ...paymentSettings };
  delete safePaymentSettings.mp_tokens;

  if (Object.keys(safePaymentSettings).length > 0) {
    misc.payment_settings = safePaymentSettings;
  } else {
    delete misc.payment_settings;
  }

  const optionsRaw =
    boda.options && typeof boda.options === "object" && !Array.isArray(boda.options)
      ? ({ ...boda.options } as BodaOptions)
      : ({} as BodaOptions);
  const { password: _password, ...safeOptions } = optionsRaw;

  return {
    boda: {
      ...boda,
      options: safeOptions,
      misc,
    },
    paymentOptions,
  };
}
