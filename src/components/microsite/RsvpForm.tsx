"use client";

import { useActionState, useState } from "react";
import { submitPublicRsvpAction } from "@/lib/microsite/actions/rsvp";
import type { FormState } from "@/lib/account/form-state";
import { FormAlert } from "@/components/account/FormAlert";
import { HoneypotField } from "@/components/ui/HoneypotField";
import { MicrositeSectionTitle } from "@/components/themes/ThemeSection";
import {
  canChooseRsvpMenu,
  RSVP_MENU_OPTIONS,
} from "@/lib/rsvp/menu";

interface RsvpFormProps {
  slug: string;
  plan?: string | null;
  rsvpOpen: boolean;
  titleClass?: string;
}

const initialState: FormState = {};

export function RsvpForm({
  slug,
  plan,
  rsvpOpen,
  titleClass,
}: RsvpFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitPublicRsvpAction,
    initialState,
  );
  const [status, setStatus] = useState<"confirmed" | "declined">("confirmed");
  const showMenu = canChooseRsvpMenu(plan) && status === "confirmed";

  if (state.success) {
    return (
      <div className="microsite-rsvp-box">
        <MicrositeSectionTitle className={titleClass ?? ""}>
          RSVP
        </MicrositeSectionTitle>
        <div className="mt-5 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-5 text-center">
          <p className="text-2xl text-emerald-700" aria-hidden>
            ✓
          </p>
          <p className="mt-2 text-sm font-medium text-emerald-900">
            {state.success}
          </p>
          <p className="mt-2 text-xs text-emerald-800/80">
            Los novios ya recibieron tu respuesta.
          </p>
        </div>
      </div>
    );
  }

  if (!rsvpOpen) {
    return (
      <div className="microsite-rsvp-box">
        <MicrositeSectionTitle className={titleClass ?? ""}>
          RSVP
        </MicrositeSectionTitle>
        <p className="mt-3 text-sm text-[var(--theme-text-muted)]">
          La lista de confirmaciones está completa por ahora. Contactá a los
          novios si necesitás más información.
        </p>
      </div>
    );
  }

  return (
    <div className="microsite-rsvp-box">
      <MicrositeSectionTitle className={titleClass ?? ""}>RSVP</MicrositeSectionTitle>
      <p className="mt-3 text-sm text-[var(--theme-text-muted)]">
        Confirmá tu asistencia completando el formulario.
      </p>

      <form
        action={formAction}
        aria-busy={isPending}
        className="mt-6 space-y-4"
      >
        <input type="hidden" name="boda_slug" value={slug} />
        <HoneypotField id="rsvp-website" />

        <label
          htmlFor="rsvp-name"
          className="block text-sm font-medium text-stone-700"
        >
          Nombre y apellido
        </label>
        <input
          id="rsvp-name"
          name="name"
          required
          minLength={2}
          maxLength={120}
          className="w-full rounded-xl border border-stone-200/80 bg-white/90 px-4 py-3 text-stone-800"
          placeholder="Tu nombre y apellido"
          autoComplete="name"
        />

        <label
          htmlFor="rsvp-email"
          className="block text-sm font-medium text-stone-700"
        >
          Email (opcional)
        </label>
        <input
          id="rsvp-email"
          name="email"
          type="email"
          maxLength={254}
          className="w-full rounded-xl border border-stone-200/80 bg-white/90 px-4 py-3 text-stone-800"
          placeholder="Email (opcional)"
          autoComplete="email"
        />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-stone-700">
            ¿Vas a asistir?
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label
              className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition ${
                status === "confirmed"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-stone-200/80 bg-white/90 text-stone-700 hover:bg-white"
              }`}
            >
              <input
                type="radio"
                name="status"
                value="confirmed"
                checked={status === "confirmed"}
                onChange={() => setStatus("confirmed")}
                required
                className="sr-only"
              />
              Sí, asistiré
            </label>
            <label
              className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition ${
                status === "declined"
                  ? "border-stone-400 bg-stone-100 text-stone-800"
                  : "border-stone-200/80 bg-white/90 text-stone-700 hover:bg-white"
              }`}
            >
              <input
                type="radio"
                name="status"
                value="declined"
                checked={status === "declined"}
                onChange={() => setStatus("declined")}
                required
                className="sr-only"
              />
              No podré asistir
            </label>
          </div>
        </fieldset>

        {showMenu ? (
          <label className="block text-sm font-medium text-stone-700">
            ¿Necesitás menú especial?
            <select
              name="menu"
              defaultValue="general"
              className="mt-2 w-full rounded-xl border border-stone-200/80 bg-white/90 px-4 py-3 text-sm font-normal text-stone-800"
            >
              {RSVP_MENU_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="menu" value="general" />
        )}

        <label
          htmlFor="rsvp-notes"
          className="block text-sm font-medium text-stone-700"
        >
          Mensaje para los novios (opcional)
        </label>
        <textarea
          id="rsvp-notes"
          name="notes"
          rows={2}
          maxLength={1000}
          className="w-full rounded-xl border border-stone-200/80 bg-white/90 px-4 py-3 text-stone-800"
          placeholder="Mensaje para los novios (opcional)"
        />

        <FormAlert error={state.error} />

        <button
          type="submit"
          disabled={isPending}
          className="microsite-btn w-full disabled:opacity-60"
        >
          {isPending ? "Enviando…" : "Confirmar asistencia"}
        </button>
      </form>
    </div>
  );
}
