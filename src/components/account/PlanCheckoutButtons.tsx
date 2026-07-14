"use client";

import { useActionState, useEffect } from "react";
import {
  createPlanCheckoutAction,
  type PlanCheckoutState,
} from "@/lib/account/actions/plan-checkout";
import { FormAlert } from "@/components/account/FormAlert";
import {
  formatPlanPriceArs,
  PLAN_PRODUCTS,
  type PlanProduct,
} from "@/lib/plans/pricing";
import { normalizePlan } from "@/lib/plans/features";

interface PlanCheckoutButtonsProps {
  currentPlan: string;
  mpConfigured: boolean;
}

const initialState: PlanCheckoutState = {};

const planRank: Record<string, number> = {
  free: 0,
  basico: 1,
  premium: 2,
};

function canUpgradeTo(currentPlan: string, targetPlan: string): boolean {
  const current = planRank[normalizePlan(currentPlan)] ?? 0;
  const target = planRank[targetPlan] ?? 0;
  return target > current;
}

function PlanCheckoutCard({
  product,
  disabled,
}: {
  product: PlanProduct;
  disabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    createPlanCheckoutAction,
    initialState,
  );

  useEffect(() => {
    if (state.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state.redirectTo]);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-stone-200 p-5"
    >
      <input type="hidden" name="plan" value={product.slug} />
      <p className="font-semibold text-stone-800">{product.name}</p>
      <p className="mt-1 text-2xl font-semibold text-[#556B2F]">
        {formatPlanPriceArs(product.priceArs)}
      </p>
      <p className="mt-2 text-sm text-stone-600">{product.description}</p>
      <p className="mt-2 text-xs text-stone-500">Pago único · Sin mensualidad</p>
      <FormAlert error={state.error} />
      <button
        type="submit"
        disabled={disabled || isPending}
        className="mt-4 w-full rounded-full bg-[#556B2F] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Redirigiendo a MercadoPago…" : `Comprar ${product.name}`}
      </button>
    </form>
  );
}

export function PlanCheckoutButtons({
  currentPlan,
  mpConfigured,
}: PlanCheckoutButtonsProps) {
  if (!mpConfigured) {
    return (
      <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Configurá <code className="text-xs">MERCADOPAGO_ACCESS_TOKEN</code> en{" "}
        <code className="text-xs">.env.local</code> para habilitar pagos.
      </p>
    );
  }

  const availableProducts = PLAN_PRODUCTS.filter((product) =>
    canUpgradeTo(currentPlan, product.dbValue),
  );

  if (availableProducts.length === 0) {
    return (
      <p className="mt-6 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
        Ya tenés el plan más alto disponible.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm font-medium text-stone-700">
        Mejorá tu plan con MercadoPago
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {availableProducts.map((product) => (
          <PlanCheckoutCard
            key={product.slug}
            product={product}
            disabled={false}
          />
        ))}
      </div>
    </div>
  );
}
