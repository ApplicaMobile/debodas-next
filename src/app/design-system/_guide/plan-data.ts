/**
 * Datos de planes para el ejemplo de /mi-cuenta/plan.
 * Fuente: debodas-next src/lib/plans/{limits,comparison,features,pricing}.ts.
 *
 * PRECIOS: en el código, pricing.ts lee PLAN_BASICO_PRICE_ARS / PLAN_PREMIUM_PRICE_ARS con fallback
 * 50.000 / 90.000. Los precios publicados hoy en producción (home WordPress) son $90.000 y $135.500,
 * que son los que se muestran acá. Para que la app los use hay que configurar:
 *   PLAN_BASICO_PRICE_ARS=90000  PLAN_PREMIUM_PRICE_ARS=135500
 */
import type { PlanFeature } from "@/components/ui/PlanCard";
import type { PlanId } from "@/components/ui/Badge";

/** Límites reales aplicados por getPlanLimits() (null = ilimitado). */
export const planLimits: Record<PlanId, { maxGifts: number | null; maxRsvpGuests: number | null; maxPictures: number | null }> = {
  free: { maxGifts: 10, maxRsvpGuests: 40, maxPictures: 3 },
  basico: { maxGifts: null, maxRsvpGuests: null, maxPictures: 4 },
  premium: { maxGifts: null, maxRsvpGuests: null, maxPictures: null },
};

export const planPrices: Record<PlanId, number> = {
  free: 0,
  basico: 90000,
  premium: 135500,
};

/** Fallbacks del código si no hay variables de entorno. */
export const codeFallbackPrices = { basico: 50000, premium: 90000 };

const lim = (n: number | null, unit: string, prefix = "Hasta") => (n === null ? `${unit} ilimitados` : `${prefix} ${n} ${unit}`);

/** Lista completa y comparable (misma fila en las tres cards), sin "Todo lo del plan Básico". */
export const planFeatureRows: Record<PlanId, PlanFeature[]> = {
  free: [
    { label: "Micrositio con tema base y cuenta regresiva" },
    { label: lim(planLimits.free.maxGifts, "regalos"), note: "todos personalizables" },
    { label: "Confirmación de asistencia (RSVP)", note: "hasta 40 invitados" },
    { label: lim(planLimits.free.maxPictures, "fotos en el álbum") },
    { label: "FAQ y galería", included: false },
    { label: "Invitaciones digitales y gestión de mesas", included: false },
    { label: "Regalo con monto libre", included: false },
  ],
  basico: [
    { label: "Todos los temas básicos" },
    { label: "Regalos ilimitados" },
    { label: "RSVP ilimitado" },
    { label: lim(planLimits.basico.maxPictures, "fotos en el álbum") },
    { label: "FAQ, galería y medios de pago avanzados" },
    { label: "Invitaciones digitales y gestión de mesas", included: false },
    { label: "Regalo con monto libre", included: false },
  ],
  premium: [
    { label: "Todos los temas, incluidos los premium" },
    { label: "Regalos ilimitados" },
    { label: "RSVP ilimitado con menú especial" },
    { label: "Fotos ilimitadas en el álbum" },
    { label: "FAQ, galería y medios de pago avanzados" },
    { label: "Invitaciones digitales y gestión de mesas" },
    { label: "Regalo con monto libre" },
  ],
};
