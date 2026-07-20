"use client";

import { useActionState } from "react";
import { updatePaymentSettingsAction } from "@/lib/account/actions/payment-settings";
import type { FormState } from "@/lib/account/form-state";
import type { BodaPaymentSettings } from "@/lib/bodas/payment-settings";
import { FormAlert } from "@/components/account/FormAlert";
import { normalizePlan } from "@/lib/plans/features";

interface PaymentSettingsPanelProps {
  plan: string;
  settings: BodaPaymentSettings;
}

const initialState: FormState = {};

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm text-stone-700">
      {label}
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5"
      />
    </label>
  );
}

export function PaymentSettingsPanel({
  plan,
  settings,
}: PaymentSettingsPanelProps) {
  const [state, formAction, isPending] = useActionState(
    updatePaymentSettingsAction,
    initialState,
  );
  const isPaidPlan = normalizePlan(plan) !== "free";

  return (
    <form action={formAction} className="space-y-8">
      <section className="rounded-2xl bg-white p-4 sm:rounded-3xl sm:p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-800">
          Mercado Pago · Checkout online
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          Credenciales de tu cuenta MP para cobrar con tarjeta. Los invitados
          pagan con un recargo del 6%.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Public Key"
            name="mp_public_key"
            defaultValue={settings.mp_tokens?.public_key}
          />
          <Field
            label="Access Token"
            name="mp_access_token"
            defaultValue={settings.mp_tokens?.access_token}
            placeholder={
              (settings as { mp_access_token_saved?: boolean })
                .mp_access_token_saved
                ? "Dejá los puntos para mantener el token guardado"
                : undefined
            }
          />
          <p className="sm:col-span-2 text-xs text-stone-500">
            El Access Token se cifra en la base. Si ya está guardado, dejá el
            campo enmascarado o pegá uno nuevo para reemplazarlo.
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 sm:rounded-3xl sm:p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-800">
          Mercado Pago · Transferencia
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Titular"
            name="mp_transfer_owner"
            defaultValue={settings.mp_alias_cvu?.owner_mp}
          />
          <Field
            label="Alias / CVU"
            name="mp_transfer_alias"
            defaultValue={settings.mp_alias_cvu?.alias_cvu_mp}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 sm:rounded-3xl sm:p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-800">
          Transferencia bancaria (ARS)
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Titular"
            name="bank_owner_ars"
            defaultValue={settings.bank_account?.owner}
          />
          <Field
            label="Banco"
            name="bank_name_ars"
            defaultValue={settings.bank_account?.bank}
          />
          <Field
            label="CBU"
            name="bank_cbu_ars"
            defaultValue={settings.bank_account?.cbu}
          />
          <Field
            label="Alias"
            name="bank_alias_ars"
            defaultValue={settings.bank_account?.alias}
          />
        </div>
      </section>

      {isPaidPlan ? (
        <section className="rounded-2xl bg-white p-4 sm:rounded-3xl sm:p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-800">
            Transferencia bancaria (USD)
          </h3>
          <p className="mt-2 text-sm text-stone-600">
            Disponible en planes Básico y Premium.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Titular"
              name="bank_owner_usd"
              defaultValue={settings.bank_account_usd?.owner}
            />
            <Field
              label="Banco"
              name="bank_name_usd"
              defaultValue={settings.bank_account_usd?.bank}
            />
            <Field
              label="CBU / cuenta"
              name="bank_cbu_usd"
              defaultValue={settings.bank_account_usd?.cbu}
            />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-4 sm:rounded-3xl sm:p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-800">PayPal</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="PayPal.me (usuario)"
            name="paypal_me"
            defaultValue={settings.paypal?.paypal_me}
            placeholder="tuusuario"
          />
          <Field
            label="Titular"
            name="paypal_owner"
            defaultValue={settings.paypal?.owner}
          />
        </div>
      </section>

      <FormAlert error={state.error} success={state.success} />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800"
      >
        {isPending ? "Guardando…" : "Guardar métodos de pago"}
      </button>
    </form>
  );
}
