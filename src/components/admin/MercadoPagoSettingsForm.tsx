"use client";

import { useActionState } from "react";
import {
  AccountFieldGroup,
  AccountFormActions,
  AccountSection,
} from "@/components/account/AccountPage";
import { FormAlert } from "@/components/account/FormAlert";
import {
  Button,
  Card,
  Checkbox,
  IconAlert,
  IconCheck,
  Input,
  Select,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  testMercadoPagoConnectionAction,
  updateMercadoPagoSettingsAction,
} from "@/lib/admin/actions/mercadopago";
import type { FormState } from "@/lib/account/form-state";
import type {
  MercadoPagoFormValues,
  MercadoPagoResolvedConfig,
} from "@/lib/mercadopago/settings";

const initialState: FormState = {};

function sourceLabel(source: MercadoPagoResolvedConfig["source"]["accessToken"]) {
  if (source === "db") return "guardado en el panel";
  if (source === "env") return "variable de entorno";
  return "sin configurar";
}

export function MercadoPagoSettingsForm({
  form,
  resolved,
  webhookUrl,
}: {
  form: MercadoPagoFormValues;
  resolved: MercadoPagoResolvedConfig;
  webhookUrl: string;
}) {
  const [saveState, saveAction, savePending] = useActionState(
    updateMercadoPagoSettingsAction,
    initialState,
  );
  const [testState, testAction, testPending] = useActionState(
    testMercadoPagoConnectionAction,
    initialState,
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <section aria-label="Estado de la configuración">
        <ul className="grid gap-4 sm:grid-cols-3">
          <StatusCard
            label="Access Token"
            ok={Boolean(resolved.accessToken)}
            okText="Listo"
            failText="Falta"
            detail={sourceLabel(resolved.source.accessToken)}
          />
          <StatusCard
            label="Modo"
            ok={!resolved.sandbox}
            okText="Producción"
            failText="Sandbox / TEST"
            detail={
              resolved.source.sandbox === "token"
                ? "Detectado por token TEST-"
                : resolved.source.sandbox === "env"
                  ? "Definido en .env"
                  : resolved.source.sandbox === "db"
                    ? "Definido en este panel"
                    : "Automático"
            }
          />
          <StatusCard
            label="Webhook"
            ok={Boolean(resolved.webhookSecret)}
            okText="Secret cargado"
            failText="Sin secret"
            detail={sourceLabel(resolved.source.webhookSecret)}
          />
        </ul>
      </section>

      <AccountSection
        id="mp-configuracion"
        title="Configuración de la plataforma"
        description="Credenciales para cobrar los planes, entorno de pago y webhook de notificaciones."
      >
        <form action={saveAction} className="space-y-6">
          <AccountFieldGroup
            title="Credenciales de la plataforma"
            description={
              <>
                Estas credenciales cobran los planes de DeBodas. Las de cada
                pareja (regalos) se cargan en{" "}
                <span className="font-semibold">Mi cuenta → Métodos de pago</span>.
                Creá o copiá las de producción en{" "}
                <a
                  href="https://www.mercadopago.com.ar/settings/account/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring rounded-sm font-semibold text-text-link underline"
                >
                  Mercado Pago → Credenciales
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
                .
              </>
            }
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                id="mp_public_key"
                label="Public Key"
                name="mp_public_key"
                defaultValue={form.publicKey}
                placeholder="APP_USR-…"
                autoComplete="off"
              />
              <Input
                id="mp_access_token"
                label="Access Token"
                name="mp_access_token"
                defaultValue={form.accessTokenMasked}
                placeholder={
                  form.accessTokenSaved
                    ? "Dejá los puntos para mantener el token"
                    : "APP_USR-… o TEST-…"
                }
                hint="El Access Token se cifra en la base. Si ya está guardado, dejá el campo enmascarado o pegá uno nuevo para reemplazarlo."
                autoComplete="off"
              />
            </div>
            {form.accessTokenSaved ? (
              <Checkbox
                name="clear_access_token"
                value="1"
                label="Quitar el Access Token guardado"
                description="Vuelve a valer el de .env, si hay."
              />
            ) : null}
          </AccountFieldGroup>

          <AccountFieldGroup
            title="Modo"
            description="En sandbox MercadoPago usa el checkout de prueba. Automático detecta tokens que empiezan con TEST-."
          >
            <Select
              id="mp_sandbox"
              name="mp_sandbox"
              label="Entorno"
              defaultValue={form.sandboxMode}
              className="sm:max-w-sm"
              options={[
                { value: "auto", label: "Automático (según el token)" },
                { value: "on", label: "Sandbox / TEST" },
                { value: "off", label: "Producción" },
              ]}
            />
          </AccountFieldGroup>

          <AccountFieldGroup
            title="Webhook"
            description="En el panel de Mercado Pago → Webhooks, agregá esta URL y copiá el secret de firma."
          >
            <div>
              <p id="mp-webhook-url-label" className="type-label text-text-primary">
                URL de notificaciones
              </p>
              <code
                aria-labelledby="mp-webhook-url-label"
                className="mt-2 block break-all rounded-md border border-border-subtle bg-surface-muted px-4 py-3 type-body-sm text-text-primary"
              >
                {webhookUrl}
              </code>
            </div>
            <Input
              id="mp_webhook_secret"
              label="Webhook secret"
              name="mp_webhook_secret"
              defaultValue={form.webhookSecretMasked}
              placeholder={
                form.webhookSecretSaved
                  ? "Dejá los puntos para mantener el secret"
                  : "Secret de x-signature"
              }
              autoComplete="off"
            />
            <div className="space-y-1">
              {form.webhookSecretSaved ? (
                <Checkbox
                  name="clear_webhook_secret"
                  value="1"
                  label="Quitar el secret guardado"
                />
              ) : null}
              <Checkbox
                name="mp_webhook_strict"
                value="1"
                defaultChecked={form.webhookStrict}
                label="Modo estricto: rechazar notificaciones sin firma válida."
                description="Dejalo apagado si las apps de las parejas usan otro secret."
              />
            </div>
          </AccountFieldGroup>

          <AccountFormActions
            alert={<FormAlert error={saveState.error} success={saveState.success} />}
          >
            <Button type="submit" loading={savePending} loadingLabel="Guardando…">
              Guardar configuración
            </Button>
          </AccountFormActions>
        </form>
      </AccountSection>

      <AccountSection
        id="mp-probar"
        title="Probar conexión"
        description={
          <>
            Consulta <code className="type-caption">/users/me</code> con el token
            guardado o el que esté escrito arriba (si lo pegaste y aún no
            guardaste, copialo de nuevo acá).
          </>
        }
      >
        <form action={testAction}>
          <Input
            id="mp_access_token_probar"
            label="Access Token a probar"
            name="mp_access_token"
            placeholder="Vacío = usa el token ya configurado"
            hint="Opcional. Si lo dejás vacío, se prueba el token ya configurado."
            autoComplete="off"
            className="sm:max-w-xl"
          />
          <AccountFormActions
            alert={<FormAlert error={testState.error} success={testState.success} />}
          >
            <Button
              type="submit"
              variant="secundario"
              loading={testPending}
              loadingLabel="Probando…"
            >
              Probar MercadoPago
            </Button>
          </AccountFormActions>
        </form>
      </AccountSection>
    </div>
  );
}

function StatusCard({
  label,
  ok,
  okText,
  failText,
  detail,
}: {
  label: string;
  ok: boolean;
  okText: string;
  failText: string;
  detail: string;
}) {
  return (
    <Card as="li" padding="md" className="h-full">
      <p className="type-caption font-semibold text-text-tertiary">{label}</p>
      <p
        className={cn(
          "mt-2 flex items-center gap-2 type-h4",
          ok ? "text-status-success-fg" : "text-status-warning-fg",
        )}
      >
        {ok ? <IconCheck size={20} /> : <IconAlert size={20} />}
        {ok ? okText : failText}
      </p>
      <p className="mt-1 type-caption text-text-secondary">{detail}</p>
    </Card>
  );
}
