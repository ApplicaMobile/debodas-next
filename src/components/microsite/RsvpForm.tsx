"use client";

import { useActionState } from "react";
import { submitPublicRsvpAction } from "@/lib/microsite/actions/rsvp";
import type { FormState } from "@/lib/account/form-state";
import { FormAlert } from "@/components/account/FormAlert";
import { MicrositeSectionTitle } from "@/components/themes/ThemeSection";

interface RsvpFormProps {
  slug: string;
  rsvpOpen: boolean;
  titleClass?: string;
}

const initialState: FormState = {};

export function RsvpForm({ slug, rsvpOpen, titleClass }: RsvpFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitPublicRsvpAction,
    initialState,
  );

  if (state.success) {
    return (
      <div className="microsite-rsvp-box">
        <MicrositeSectionTitle className={titleClass ?? ""}>
          RSVP
        </MicrositeSectionTitle>
        <FormAlert success={state.success} />
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

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="boda_slug" value={slug} />

        <input
          name="name"
          required
          minLength={2}
          className="w-full rounded-xl border border-stone-200/80 bg-white/90 px-4 py-3 text-stone-800"
          placeholder="Tu nombre y apellido"
          autoComplete="name"
        />

        <input
          name="email"
          type="email"
          className="w-full rounded-xl border border-stone-200/80 bg-white/90 px-4 py-3 text-stone-800"
          placeholder="Email (opcional)"
          autoComplete="email"
        />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-stone-700">
            ¿Vas a asistir?
          </legend>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="radio"
              name="status"
              value="confirmed"
              defaultChecked
              required
            />
            Sí, asistiré
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="radio" name="status" value="declined" required />
            No podré asistir
          </label>
        </fieldset>

        <textarea
          name="notes"
          rows={2}
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
