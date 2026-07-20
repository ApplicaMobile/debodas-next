"use client";

import { useActionState } from "react";
import { updateOptionsAction } from "@/lib/account/actions/content";
import type { FormState } from "@/lib/account/form-state";
import { planLabels, normalizePlan } from "@/lib/plans/features";
import { getCurrentPlanFeatures } from "@/lib/plans/comparison";
import { FormAlert } from "@/components/account/FormAlert";
import { PlanComparison } from "@/components/account/PlanComparison";
import { PlanUsageMeter } from "@/components/account/PlanUsageMeter";
import { getPlanLimits } from "@/lib/plans/limits";

interface PlanPanelProps {
  plan: string;
  showFaq: boolean;
  showDressCode: boolean;
  isOnline: boolean;
  mpConfigured: boolean;
  demoPlanSwitch: boolean;
  paymentNotice?: string | null;
  giftCount: number;
  guestCount: number;
}

const initialState: FormState = {};

const PAYMENT_NOTICES: Record<string, string> = {
  success:
    "Pago recibido. Si tu plan no se actualizó aún, aguardá unos segundos mientras confirmamos con MercadoPago.",
  pending:
    "Tu pago está pendiente. Te avisaremos cuando MercadoPago lo confirme.",
  failure: "El pago no se completó. Podés intentarlo nuevamente.",
};

export function PlanPanel({
  plan,
  showFaq,
  showDressCode,
  isOnline,
  mpConfigured,
  demoPlanSwitch,
  paymentNotice,
  giftCount,
  guestCount,
}: PlanPanelProps) {
  const [state, formAction, isPending] = useActionState(
    updateOptionsAction,
    initialState,
  );
  const normalized = normalizePlan(plan);
  const label = planLabels[plan] ?? planLabels[normalized];
  const features = getCurrentPlanFeatures(plan);
  const limits = getPlanLimits(plan);
  const notice =
    paymentNotice && PAYMENT_NOTICES[paymentNotice]
      ? PAYMENT_NOTICES[paymentNotice]
      : null;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-xs uppercase tracking-wide text-stone-500">
          Plan actual
        </p>
        <h3 className="mt-1 font-serif text-3xl font-semibold text-stone-800">
          {label}
        </h3>
        <ul className="mt-4 space-y-2 text-sm text-stone-600">
          {features.map((feature) => (
            <li key={feature}>✓ {feature}</li>
          ))}
        </ul>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-stone-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Uso de regalos
            </p>
            <PlanUsageMeter
              label="regalos"
              current={giftCount}
              max={limits.maxGifts}
            />
          </div>
          <div className="rounded-2xl bg-stone-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Uso de RSVP
            </p>
            <PlanUsageMeter
              label="invitados"
              current={guestCount}
              max={limits.maxRsvpGuests}
            />
          </div>
        </div>

        {notice ? (
          <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            {notice}
          </p>
        ) : null}
      </section>

      <PlanComparison
        currentPlan={plan}
        mpConfigured={mpConfigured}
        demoPlanSwitch={demoPlanSwitch}
      />

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h3 className="text-lg font-semibold text-stone-800">
          Opciones del micrositio
        </h3>
        <form action={formAction} className="mt-4 space-y-4">
          <label className="flex items-center gap-3 text-sm text-stone-700">
            <input
              type="checkbox"
              name="is_online"
              defaultChecked={isOnline}
              className="h-4 w-4 rounded border-stone-300"
            />
            Micrositio online (visible / activo)
          </label>
          <label className="flex items-center gap-3 text-sm text-stone-700">
            <input
              type="checkbox"
              name="show_faq"
              defaultChecked={showFaq}
              className="h-4 w-4 rounded border-stone-300"
            />
            Mostrar sección FAQ en el micrositio
          </label>
          <label className="flex items-center gap-3 text-sm text-stone-700">
            <input
              type="checkbox"
              name="show_dress_code"
              defaultChecked={showDressCode}
              className="h-4 w-4 rounded border-stone-300"
            />
            Mostrar sección Dress Code en el micrositio
          </label>
          <FormAlert error={state.error} success={state.success} />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800"
          >
            Guardar opciones
          </button>
        </form>
      </section>
    </div>
  );
}
