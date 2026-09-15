"use client";

import { useActionState, useState } from "react";
import { submitAbonarTarjetaAction } from "@/lib/microsite/actions/abonar";
import type { FormState } from "@/lib/account/form-state";
import type { AbonarTarjetaConfig } from "@/lib/bodas/abonar-tarjeta";
import { FormAlert } from "@/components/account/FormAlert";
import { ImageFileInput } from "@/components/ui/ImageFileInput";
import { HoneypotField } from "@/components/ui/HoneypotField";
import { MicrositeSectionTitle } from "@/components/themes/ThemeSection";

const initialState: FormState = {};

export function AbonarTarjetaSection({
  slug,
  config,
  titleClass,
}: {
  slug: string;
  config: AbonarTarjetaConfig;
  titleClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    submitAbonarTarjetaAction,
    initialState,
  );
  const label = config.titulo || "Abonar tarjeta";

  if (state.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-5 text-center">
        <p className="text-sm font-medium text-emerald-900">{state.success}</p>
      </div>
    );
  }

  return (
    <div>
      <MicrositeSectionTitle className={titleClass ?? ""}>
        {label}
      </MicrositeSectionTitle>
      {config.textoMonto ? (
        <p className="mt-3 text-sm text-[var(--theme-text-muted)]">
          {config.textoMonto}
        </p>
      ) : null}
      {config.valorReferencia ? (
        <p className="mt-2 text-sm font-semibold text-[var(--theme-accent)]">
          Referencia: ${config.valorReferencia}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="microsite-btn mt-5"
      >
        {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-xl font-semibold text-stone-800">
                {label}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-stone-500"
              >
                Cerrar
              </button>
            </div>
            <form action={action} className="mt-4 space-y-3">
              <input type="hidden" name="boda_slug" value={slug} />
              <HoneypotField id="abonar-website" />
              <label className="block text-sm font-medium text-stone-700">
                Tu nombre
                <input
                  name="nombre_invitado"
                  required
                  minLength={2}
                  maxLength={120}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Monto
                <input
                  name="monto"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  defaultValue={config.valorReferencia || ""}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3"
                />
              </label>
              <ImageFileInput
                name="payment_proof"
                label="Comprobante (opcional)"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                variant="dropzone"
              />
              <FormAlert error={state.error} success={state.success} />
              <button
                type="submit"
                disabled={pending}
                className="microsite-btn w-full disabled:opacity-60"
              >
                {pending ? "Enviando…" : "Enviar comprobante"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
