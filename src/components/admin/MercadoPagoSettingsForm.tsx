"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/account/FormAlert";
import { FormField, FormInput } from "@/components/account/FormField";
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
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
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
      </section>

      <form action={saveAction} className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-semibold text-stone-800">
            Credenciales de la plataforma
          </h3>
          <p className="mt-2 text-sm text-stone-600">
            Estas credenciales cobran los planes de DeBodas. Las de cada pareja
            (regalos) se cargan en{" "}
            <span className="font-medium">Mi cuenta → Métodos de pago</span>.
            Creá o copiá las de producción en{" "}
            <a
              href="https://www.mercadopago.com.ar/settings/account/credentials"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#6f5f47] underline"
            >
              Mercado Pago → Credenciales
            </a>
            .
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Public Key"
              name="mp_public_key"
              defaultValue={form.publicKey}
              placeholder="APP_USR-…"
              autoComplete="off"
            />
            <FormInput
              label="Access Token"
              name="mp_access_token"
              defaultValue={form.accessTokenMasked}
              placeholder={
                form.accessTokenSaved
                  ? "Dejá los puntos para mantener el token"
                  : "APP_USR-… o TEST-…"
              }
              autoComplete="off"
            />
          </div>
          {form.accessTokenSaved ? (
            <label className="mt-4 flex items-center gap-2 text-sm text-stone-600">
              <input type="checkbox" name="clear_access_token" value="1" />
              Quitar el Access Token guardado (vuelve a valer el de .env, si hay)
            </label>
          ) : null}
          <p className="mt-3 text-xs text-stone-500">
            El Access Token se cifra en la base. Si ya está guardado, dejá el
            campo enmascarado o pegá uno nuevo para reemplazarlo.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-semibold text-stone-800">Modo</h3>
          <p className="mt-2 text-sm text-stone-600">
            En sandbox MercadoPago usa el checkout de prueba. Automático detecta
            tokens que empiezan con TEST-.
          </p>
          <FormField label="Entorno" htmlFor="mp_sandbox" className="mt-4">
            <select
              id="mp_sandbox"
              name="mp_sandbox"
              defaultValue={form.sandboxMode}
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-[#e6dac7] focus:outline-none focus:ring-2 focus:ring-[#e6dac7]/25"
            >
              <option value="auto">Automático (según el token)</option>
              <option value="on">Sandbox / TEST</option>
              <option value="off">Producción</option>
            </select>
          </FormField>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-semibold text-stone-800">Webhook</h3>
          <p className="mt-2 text-sm text-stone-600">
            En el panel de Mercado Pago → Webhooks, agregá esta URL y copiá el
            secret de firma.
          </p>
          <label className="mt-4 block text-sm font-medium text-stone-700">
            URL de notificaciones
          </label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-xl bg-stone-50 px-4 py-3 text-xs text-stone-700">
              {webhookUrl}
            </code>
          </div>
          <div className="mt-4">
            <FormInput
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
          </div>
          {form.webhookSecretSaved ? (
            <label className="mt-4 flex items-center gap-2 text-sm text-stone-600">
              <input type="checkbox" name="clear_webhook_secret" value="1" />
              Quitar el secret guardado
            </label>
          ) : null}
          <label className="mt-4 flex items-start gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              name="mp_webhook_strict"
              value="1"
              defaultChecked={form.webhookStrict}
              className="mt-0.5"
            />
            <span>
              Modo estricto: rechazar notificaciones sin firma válida. Dejalo
              apagado si las apps de las parejas usan otro secret.
            </span>
          </label>
        </section>

        <FormAlert error={saveState.error} success={saveState.success} />

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={savePending}
            className="rounded-full bg-[#06263a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {savePending ? "Guardando…" : "Guardar configuración"}
          </button>
        </div>
      </form>

      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-lg font-semibold text-stone-800">
          Probar conexión
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          Consulta <code className="text-xs">/users/me</code> con el token
          guardado o el que esté escrito arriba (si lo pegaste y aún no
          guardaste, copialo de nuevo acá).
        </p>
        <form action={testAction} className="mt-4 space-y-4">
          <FormInput
            label="Access Token a probar"
            name="mp_access_token"
            placeholder="Vacío = usa el token ya configurado"
            autoComplete="off"
          />
          <FormAlert error={testState.error} success={testState.success} />
          <button
            type="submit"
            disabled={testPending}
            className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 disabled:opacity-60"
          >
            {testPending ? "Probando…" : "Probar MercadoPago"}
          </button>
        </form>
      </section>
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
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p
        className={`mt-2 text-lg font-semibold ${
          ok ? "text-emerald-700" : "text-amber-800"
        }`}
      >
        {ok ? okText : failText}
      </p>
      <p className="mt-1 text-xs text-stone-500">{detail}</p>
    </div>
  );
}
