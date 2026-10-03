/**
 * Permite cambiar el plan sin MercadoPago (solo local / staging explícito).
 * Producción: off, salvo ALLOW_DEMO_PLAN_SWITCH=true.
 */
export function isDemoPlanSwitchEnabled(): boolean {
  if (process.env.ALLOW_DEMO_PLAN_SWITCH === "true") {
    return true;
  }
  if (process.env.ALLOW_DEMO_PLAN_SWITCH === "false") {
    return false;
  }
  return process.env.NODE_ENV !== "production";
}

/**
 * En demo/local, regalos pueden usar el Access Token de la plataforma
 * (sandbox) si la pareja no tiene credenciales propias.
 */
export function canUsePlatformGiftCheckout(slug?: string | null): boolean {
  if (slug === "demo") {
    return true;
  }
  return isDemoPlanSwitchEnabled();
}
