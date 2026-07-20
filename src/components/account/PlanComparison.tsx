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
import {
  canUpgradeToPlan,
  getAccountPlanCards,
  getPlanRank,
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

function MpUpgradeButton({
  planSlug,
  disabled,
  label,
}: {
  planSlug: AccountPlanId;
  disabled: boolean;
  label: string;
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
    <form action={formAction} className="mt-auto space-y-3 pt-5">
      <input type="hidden" name="plan" value={planSlug} />
      <FormAlert error={state.error} />
      <button
        type="submit"
        disabled={disabled || isPending}
        className="w-full rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-60"
      >
        {isPending ? "Redirigiendo a MercadoPago…" : label}
      </button>
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
    <form action={formAction} className="mt-auto space-y-3 pt-5">
      <input type="hidden" name="plan" value={planSlug} />
      <FormAlert error={state.error} success={state.success} />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full border border-[#e6dac7] bg-white px-5 py-2.5 text-sm font-semibold text-[#e6dac7] disabled:opacity-60"
      >
        {isPending ? "Actualizando…" : label}
      </button>
      <p className="text-center text-[11px] text-stone-400">
        Modo demo · sin MercadoPago
      </p>
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

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-stone-800">
          Compará los planes
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          Mirá las diferencias y mejorá cuando quieras. Pago único, sin
          mensualidad.
        </p>
      </div>

      {!mpConfigured && demoPlanSwitch ? (
        <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Estás en <strong>modo demo</strong>: podés cambiar de plan sin
          MercadoPago. En producción se usa el checkout real.
        </p>
      ) : null}

      {!mpConfigured && !demoPlanSwitch ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Configurá <code className="text-xs">MERCADOPAGO_ACCESS_TOKEN</code> en{" "}
          <code className="text-xs">.env.local</code> para habilitar la compra de
          planes.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => {
          const isCurrent = card.id === current;
          const canUpgrade = canUpgradeToPlan(currentPlan, card.id);
          const isLower = getPlanRank(card.id) < currentRank;

          return (
            <article
              key={card.id}
              className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                isCurrent
                  ? "border-[#e6dac7] ring-2 ring-[#e6dac7]/20"
                  : "border-stone-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                    Plan
                  </p>
                  <h4 className="mt-1 font-serif text-2xl font-semibold text-stone-800">
                    {card.label}
                  </h4>
                </div>
                {isCurrent ? (
                  <span className="rounded-full bg-[#e6dac7]/10 px-3 py-1 text-xs font-semibold text-[#d4c4a8]">
                    Tu plan
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-3xl font-semibold text-[#e6dac7]">
                {card.priceLabel}
              </p>
              {card.priceNote ? (
                <p className="mt-1 text-xs text-stone-500">{card.priceNote}</p>
              ) : null}

              <ul className="mt-5 space-y-2 text-sm text-stone-600">
                {card.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-[#e6dac7]">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <p className="mt-auto rounded-xl bg-stone-50 px-4 py-3 pt-5 text-sm text-stone-600">
                  Este es tu plan activo.
                </p>
              ) : mpConfigured && canUpgrade && card.purchasable ? (
                <MpUpgradeButton
                  planSlug={card.id}
                  disabled={false}
                  label={`Pasar a ${card.label}`}
                />
              ) : demoPlanSwitch ? (
                <DemoPlanButton
                  planSlug={card.id}
                  label={
                    canUpgrade
                      ? `Pasar a ${card.label} (demo)`
                      : `Cambiar a ${card.label} (demo)`
                  }
                />
              ) : canUpgrade && card.purchasable ? (
                <MpUpgradeButton
                  planSlug={card.id}
                  disabled
                  label={`Pasar a ${card.label}`}
                />
              ) : (
                <p className="mt-auto pt-5 text-sm text-stone-500">
                  {isLower
                    ? "Incluido en tu plan actual."
                    : "Plan de entrada sin costo."}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
