"use client";

import { useActionState, useEffect } from "react";
import {
  createPlanCheckoutAction,
  type PlanCheckoutState,
} from "@/lib/account/actions/plan-checkout";
import {
  setDemoPlanAction,
  type DemoPlanState,
} from "@/lib/account/actions/demo-plan";
import { FormAlert } from "@/components/account/FormAlert";
import { Alert, Button, PlanCard, type ButtonVariant } from "@/components/ui";
import {
  canUpgradeToPlan,
  getAccountPlanCards,
  getPlanRank,
  RECOMMENDED_PLAN,
  type AccountPlanId,
} from "@/lib/plans/comparison";
import { normalizePlan } from "@/lib/plans/features";

interface PlanComparisonProps {
  currentPlan: string;
  mpConfigured: boolean;
  demoPlanSwitch: boolean;
}

const checkoutInitial: PlanCheckoutState = {};
const demoInitial: DemoPlanState = {};

function CtaHelper({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-center type-body-sm text-text-secondary">
      {children}
    </p>
  );
}

function MpUpgradeButton({
  planSlug,
  disabled,
  label,
  variant,
  helper,
}: {
  planSlug: AccountPlanId;
  disabled: boolean;
  label: string;
  variant: ButtonVariant;
  helper: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createPlanCheckoutAction,
    checkoutInitial,
  );

  useEffect(() => {
    if (state.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state.redirectTo]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="plan" value={planSlug} />
      <FormAlert error={state.error} />
      <Button
        type="submit"
        variant={variant}
        size="lg"
        fullWidth
        disabled={disabled}
        loading={isPending}
        loadingLabel="Redirigiendo a MercadoPago…"
      >
        {label}
      </Button>
      <CtaHelper>{helper}</CtaHelper>
    </form>
  );
}

function DemoPlanButton({
  planSlug,
  label,
}: {
  planSlug: AccountPlanId;
  label: string;
}) {
  const [state, formAction, isPending] = useActionState(
    setDemoPlanAction,
    demoInitial,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="plan" value={planSlug} />
      <FormAlert error={state.error} success={state.success} />
      <Button
        type="submit"
        variant="secundario"
        size="lg"
        fullWidth
        loading={isPending}
        loadingLabel="Actualizando…"
      >
        {label}
      </Button>
      <CtaHelper>Modo demo · sin MercadoPago</CtaHelper>
    </form>
  );
}

export function PlanComparison({
  currentPlan,
  mpConfigured,
  demoPlanSwitch,
}: PlanComparisonProps) {
  const current = normalizePlan(currentPlan);
  const currentRank = getPlanRank(currentPlan);
  const cards = getAccountPlanCards();
  const paymentsUnavailable = !mpConfigured && !demoPlanSwitch;
  const hasPurchasableUpgrade = cards.some(
    (card) => card.purchasable && canUpgradeToPlan(currentPlan, card.id),
  );

  return (
    <section aria-labelledby="comparar-planes" className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h3 id="comparar-planes" className="type-h3 text-text-primary">
          Compará los planes
        </h3>
        <p className="type-body-sm text-text-secondary">
          Pago único · Sin mensualidad · Precios en pesos argentinos
        </p>
      </div>

      {!mpConfigured && demoPlanSwitch ? (
        <Alert tone="info" title="Estás en modo demo">
          Podés cambiar de plan sin pagar. Para probar el checkout de
          MercadoPago, un administrador tiene que cargar un Access Token de
          prueba (TEST-) en el panel de administración.
        </Alert>
      ) : null}

      {mpConfigured && demoPlanSwitch ? (
        <Alert tone="info" title="Modo demo con MercadoPago sandbox">
          El botón para mejorar el plan abre el checkout de prueba. Usá una
          tarjeta de prueba de MercadoPago.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
        {cards.map((card) => {
          const isCurrent = card.id === current;
          const canUpgrade = canUpgradeToPlan(currentPlan, card.id);
          const isLower = getPlanRank(card.id) < currentRank;
          const recommended =
            card.id === RECOMMENDED_PLAN && !isCurrent && canUpgrade;
          const variant: ButtonVariant = recommended ? "primario" : "secundario";

          let footer: React.ReactNode = null;
          if (isCurrent) {
            footer = null;
          } else if (mpConfigured && canUpgrade && card.purchasable) {
            footer = (
              <MpUpgradeButton
                planSlug={card.id}
                disabled={false}
                label={`Pasar a ${card.label}`}
                variant={variant}
                helper="Pagás con MercadoPago: tarjeta, débito o dinero en cuenta."
              />
            );
          } else if (demoPlanSwitch) {
            footer = (
              <DemoPlanButton
                planSlug={card.id}
                label={
                  canUpgrade
                    ? `Pasar a ${card.label} (demo)`
                    : `Cambiar a ${card.label} (demo)`
                }
              />
            );
          } else if (canUpgrade && card.purchasable) {
            footer = (
              <MpUpgradeButton
                planSlug={card.id}
                disabled
                label={`Pasar a ${card.label}`}
                variant={variant}
                helper="Los pagos online no están disponibles en este momento. Escribinos y te ayudamos a mejorar tu plan."
              />
            );
          } else {
            footer = (
              <p className="rounded-md bg-surface-muted px-4 py-3 text-center type-body-sm text-text-secondary">
                {isLower
                  ? "Incluido en tu plan actual."
                  : "Plan de entrada sin costo."}
              </p>
            );
          }

          return (
            <PlanCard
              key={card.id}
              headingLevel="h4"
              name={card.label}
              price={card.priceArs}
              priceNote={card.priceNote}
              description={card.description}
              features={card.featureRows}
              recommended={recommended}
              current={isCurrent}
              footer={footer}
            />
          );
        })}
      </div>

      {paymentsUnavailable && hasPurchasableUpgrade ? (
        <Alert
          tone="info"
          title="Los pagos online no están disponibles por ahora"
          action={
            <Button variant="secundario" href="/contacto">
              Escribinos
            </Button>
          }
        >
          Estamos terminando de configurar MercadoPago. Si querés mejorar tu
          plan hoy, escribinos y te ayudamos a hacerlo por otro medio.
        </Alert>
      ) : null}
    </section>
  );
}
