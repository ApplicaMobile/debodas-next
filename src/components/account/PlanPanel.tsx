"use client";

import { useActionState } from "react";
import { updateOptionsAction } from "@/lib/account/actions/content";
import type { FormState } from "@/lib/account/form-state";
import {
  planFeatures,
  planLabels,
  normalizePlan,
} from "@/lib/plans/features";
import { FormAlert } from "@/components/account/FormAlert";
import { PlanCheckoutButtons } from "@/components/account/PlanCheckoutButtons";

interface PlanPanelProps {
  plan: string;
  showFaq: boolean;
  showDressCode: boolean;
  mpConfigured: boolean;
  paymentNotice?: string | null;
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
  mpConfigured,
  paymentNotice,
}: PlanPanelProps) {
  const [state, formAction, isPending] = useActionState(
    updateOptionsAction,
    initialState,
  );
  const normalized = normalizePlan(plan);
  const label = planLabels[plan] ?? planLabels[normalized];
  const features = planFeatures[normalized] ?? planFeatures.free;
  const notice =
    paymentNotice && PAYMENT_NOTICES[paymentNotice]
      ? PAYMENT_NOTICES[paymentNotice]
      : null;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
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

        {notice ? (
          <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            {notice}
          </p>
        ) : null}

        <PlanCheckoutButtons
          currentPlan={plan}
          mpConfigured={mpConfigured}
        />
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-800">
          Opciones del micrositio
        </h3>
        <form action={formAction} className="mt-4 space-y-4">
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
            Mostrar dress code (cuando esté implementado)
          </label>
          <FormAlert error={state.error} success={state.success} />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-[#556B2F] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Guardar opciones
          </button>
        </form>
      </section>
    </div>
  );
}
