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
