import { Alert, Button, Card, PaymentStatusBadge, PlanBadge, PlanCard, UsageMeter, formatArs } from "@/components/ui";
import { codeFallbackPrices, planFeatureRows, planLimits, planPrices } from "./plan-data";
import { Section, Spec } from "./Section";

/** Rediseño de la sección de precios de /mi-cuenta/plan (pareja en plan Free, pago de Premium pendiente). */
export function PlanExample() {
  return (
    <Section
      id="plan-ejemplo"
      overline="Ejemplo aplicado"
      title="Rediseño de /mi-cuenta/plan"
      lead="Precio legible, plan recomendado, plan actual claro, estados de pago con el color correcto y features con los límites reales del código."
    >
      <div className="rounded-md border border-border-default bg-bg-canvas p-4 sm:p-8 lg:p-12">
        {/* En la app, este bloque es el contenido de la página: el título es un h1. */}
        <header className="max-w-3xl">
          <p className="type-overline text-text-accent">Mi cuenta · Plan</p>
          <p role="heading" aria-level={3} className="mt-2 type-h2 text-text-primary sm:type-h1">Tu plan</p>
          <p className="mt-3 type-body-lg text-text-secondary">
            Elegí el plan para tu boda. Pagás una sola vez con MercadoPago y no hay mensualidad.
          </p>
        </header>

        <Alert
          className="mt-8"
          tone="pendiente"
          title="Estamos esperando la acreditación de tu pago del plan Premium."
          action={<Button variant="fantasma" size="sm" href="#plan-ejemplo">Ver estado del pago</Button>}
        >
          MercadoPago lo está revisando (suele tardar unos minutos). Te avisamos por email; no hace falta que vuelvas a pagar.
        </Alert>

        <Card as="section" aria-labelledby="plan-actual" padding="lg" className="mt-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <p className="type-overline text-text-accent">Plan actual</p>
              <div className="flex flex-wrap items-center gap-3">
                <h4 id="plan-actual" className="type-h3 text-text-primary">Free</h4>
                <PlanBadge plan="free" />
              </div>
              <p className="type-body-sm text-text-secondary">Último pago: Premium · {formatArs(planPrices.premium)} · <PaymentStatusBadge status="pending" /></p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
              <UsageMeter label="Regalos" value={8} max={planLimits.free.maxGifts} unit="regalos" upgradeHref="#comparar" />
              <UsageMeter label="Invitados (RSVP)" value={40} max={planLimits.free.maxRsvpGuests} unit="invitados" upgradeHref="#comparar" />
              <UsageMeter label="Fotos del álbum" value={1} max={planLimits.free.maxPictures} unit="fotos" upgradeHref="#comparar" />
            </div>
          </div>
        </Card>

        <section aria-labelledby="comparar" className="mt-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h4 id="comparar" className="type-h3 text-text-primary">Compará los planes</h4>
            <p className="type-body-sm text-text-secondary">Pago único · Sin mensualidad · Precios en pesos argentinos</p>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:items-stretch">
            <PlanCard
              headingLevel="h4"
              name="Free"
              price={planPrices.free}
              priceNote="Sin costo de alta"
              description="Para probar DeBodas y armar lo básico."
              features={planFeatureRows.free}
              current
            />
            <PlanCard
              headingLevel="h4"
              name="Básico"
              price={planPrices.basico}
              priceNote="Pago único · Sin mensualidad"
              description="Regalos e invitados sin límite."
              features={planFeatureRows.basico}
              recommended
              recommendedLabel="Más elegido"
              cta={{ label: "Pasar a Básico", href: "#plan-ejemplo", helper: "Pagás con MercadoPago: tarjeta, débito o dinero en cuenta." }}
            />
            <PlanCard
              headingLevel="h4"
              name="Premium"
              price={planPrices.premium}
              priceNote="Pago único · Sin mensualidad"
              description="La experiencia completa para tu boda."
              features={planFeatureRows.premium}
              cta={{ label: "Pasar a Premium", loading: true, loadingLabel: "Redirigiendo a MercadoPago…", helper: "Estado de carga del botón al iniciar el pago." }}
            />
          </div>

          <Alert
            className="mt-8"
            tone="info"
            title="Si los pagos online no están disponibles"
            action={
              <a
                href="https://wa.me/"
                className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-whatsapp-bg px-6 py-3 type-button text-brand-whatsapp-fg transition-colors hover:bg-brand-whatsapp-bg-hover"
              >
                Escribinos por WhatsApp
              </a>
            }
          >
            Reemplaza el botón deshabilitado sin explicación y el texto técnico “/admin/mercadopago”: la pareja siempre tiene una salida.
          </Alert>
        </section>
      </div>

      <div role="note" className="mt-8 rounded-md border border-border-default bg-surface-default p-6">
        <p className="type-h4 text-text-primary">Notas de datos (para el equipo)</p>
        <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 type-body-sm text-text-secondary">
          <li>
            <strong className="text-text-primary">Precios:</strong> se muestran los de producción ({formatArs(planPrices.basico)} / {formatArs(planPrices.premium)}).
            En el código, <Spec>lib/plans/pricing.ts</Spec> tiene fallback {formatArs(codeFallbackPrices.basico)} / {formatArs(codeFallbackPrices.premium)};
            hay que definir <Spec>PLAN_BASICO_PRICE_ARS=90000</Spec> y <Spec>PLAN_PREMIUM_PRICE_ARS=135500</Spec>.
          </li>
          <li>
            <strong className="text-text-primary">Regalos personalizados:</strong> la home dice “1 regalo personalizado” para Free, pero el código
            (<Spec>limits.ts</Spec>) define <Spec>maxCustomGifts: 10</Spec> y el límite que realmente se aplica es <Spec>maxGifts: 10</Spec>
            (<Spec>canAddCustomGift</Spec> no se usa). Se muestra “Hasta 10 regalos · todos personalizables”.
          </li>
          <li>
            <strong className="text-text-primary">Fotos:</strong> el código limita el álbum a 3 (Free) y 4 (Básico); Premium ilimitado. El sitio WordPress
            publica “5 fotos” y “10 fotos”. Se usan los valores del código.
          </li>
          <li>
            <strong className="text-text-primary">Nombre del plan gratis:</strong> “Free” (panel, <Spec>planLabels</Spec>) vs. “Gratuito” (home). Se usa “Free”.
          </li>
          <li>
            <strong className="text-text-primary">Soporte prioritario / Spotify:</strong> la home promete soporte prioritario y <Spec>features.ts</Spec> “Playlist de Spotify”;
            ninguno tiene lógica en el código, así que no se listan.
          </li>
        </ul>
      </div>
    </Section>
  );
}
