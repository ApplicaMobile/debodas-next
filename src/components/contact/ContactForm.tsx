"use client";

import { useActionState } from "react";
import { submitContactAction } from "@/lib/contact/actions";
import type { FormState } from "@/lib/account/form-state";
import { FormAlert } from "@/components/account/FormAlert";
import { HoneypotField } from "@/components/ui/HoneypotField";

const initialState: FormState = {};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactAction,
    initialState,
  );

  return (
    <form action={formAction} className="relative space-y-4">
      <HoneypotField id="contact-website" />
      <FormAlert error={state.error} success={state.success} />

      <label className="block text-sm font-medium text-stone-700">
        Nombre
        <input
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-stone-200 px-4 py-3 text-base text-stone-800"
          placeholder="Tu nombre"
        />
      </label>

      <label className="block text-sm font-medium text-stone-700">
        Email
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-stone-200 px-4 py-3 text-base text-stone-800"
          placeholder="tu@email.com"
        />
      </label>

      <label className="block text-sm font-medium text-stone-700">
        Mensaje
        <textarea
          name="message"
          required
          rows={5}
          maxLength={4000}
          className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-stone-200 px-4 py-3 text-base text-stone-800"
          placeholder="¿En qué podemos ayudarte?"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="focus-ring inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#e6dac7] px-5 py-3 text-base font-semibold text-stone-800 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
