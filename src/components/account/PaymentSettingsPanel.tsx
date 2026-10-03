"use client";

import { useActionState } from "react";
import { updatePaymentSettingsAction } from "@/lib/account/actions/payment-settings";
import type { FormState } from "@/lib/account/form-state";
import type { BodaPaymentSettings } from "@/lib/bodas/payment-settings";
import { FormAlert } from "@/components/account/FormAlert";
import {
  AccountFieldGroup,
  AccountFormActions,
  AccountSection,
} from "@/components/account/AccountPage";
import { Button, Input } from "@/components/ui";
import { normalizePlan } from "@/lib/plans/features";

interface PaymentSettingsPanelProps {
  plan: string;
  settings: BodaPaymentSettings;
}

const initialState: FormState = {};

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
    <AccountSection
      id="pagos-metodos"
      title="Datos para recibir regalos"
      description="Completá los métodos que quieras ofrecerles a tus invitados al momento de regalar."
    >
      <form action={formAction} className="space-y-6">
        <AccountFieldGroup
          title="Mercado Pago · Transferencia"
          description="Tus invitados ven el alias o CVU para transferirte desde Mercado Pago."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="mp_transfer_owner"
              label="Titular"
              name="mp_transfer_owner"
              defaultValue={settings.mp_alias_cvu?.owner_mp}
            />
            <Input
              id="mp_transfer_alias"
              label="Alias / CVU"
              name="mp_transfer_alias"
              defaultValue={settings.mp_alias_cvu?.alias_cvu_mp}
            />
          </div>
        </AccountFieldGroup>

        <AccountFieldGroup
          title="Transferencia bancaria (ARS)"
          description="Cuenta en pesos para transferencias desde cualquier banco."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="bank_owner_ars"
              label="Titular"
              name="bank_owner_ars"
              defaultValue={settings.bank_account?.owner}
            />
            <Input
              id="bank_name_ars"
              label="Banco"
              name="bank_name_ars"
              defaultValue={settings.bank_account?.bank}
            />
            <Input
              id="bank_cbu_ars"
              label="CBU"
              name="bank_cbu_ars"
              defaultValue={settings.bank_account?.cbu}
            />
            <Input
              id="bank_alias_ars"
              label="Alias"
              name="bank_alias_ars"
              defaultValue={settings.bank_account?.alias}
            />
          </div>
        </AccountFieldGroup>

        {isPaidPlan ? (
          <AccountFieldGroup
            title="Transferencia bancaria (USD)"
            description="Disponible en planes Básico y Premium."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                id="bank_owner_usd"
                label="Titular"
                name="bank_owner_usd"
                defaultValue={settings.bank_account_usd?.owner}
              />
              <Input
                id="bank_name_usd"
                label="Banco"
                name="bank_name_usd"
                defaultValue={settings.bank_account_usd?.bank}
              />
              <Input
                id="bank_cbu_usd"
                label="CBU / cuenta"
                name="bank_cbu_usd"
                defaultValue={settings.bank_account_usd?.cbu}
              />
            </div>
          </AccountFieldGroup>
        ) : null}

        <AccountFieldGroup title="PayPal">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="paypal_me"
              label="PayPal.me (usuario)"
              name="paypal_me"
              defaultValue={settings.paypal?.paypal_me}
              placeholder="tuusuario"
            />
            <Input
              id="paypal_owner"
              label="Titular"
              name="paypal_owner"
              defaultValue={settings.paypal?.owner}
            />
          </div>
        </AccountFieldGroup>

        <AccountFormActions
          alert={<FormAlert error={state.error} success={state.success} />}
        >
          <Button type="submit" loading={isPending} loadingLabel="Guardando…">
            Guardar métodos de pago
          </Button>
        </AccountFormActions>
      </form>
    </AccountSection>
  );
}
