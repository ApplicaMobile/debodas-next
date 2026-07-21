"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type PasswordResetState,
} from "@/lib/auth/password-reset";
import { HoneypotField } from "@/components/ui/HoneypotField";

const initialState: PasswordResetState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <form action={action} aria-busy={pending} className="mt-8 space-y-4">
      <HoneypotField id="forgot-website" />
      <label
        htmlFor="forgot-email"
        className="block text-sm font-medium text-stone-700"
      >
        Email
      </label>
      <input
        id="forgot-email"
        name="email"
        type="email"
        maxLength={254}
        required
        autoComplete="email"
        placeholder="Tu email"
        className="w-full rounded-xl border border-stone-200 px-4 py-3"
      />
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {state.success}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#e6dac7] px-5 py-3 text-sm font-semibold text-stone-800 disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar enlace"}
      </button>
      <p className="text-center text-sm text-stone-500">
        <Link href="/login" className="font-medium text-stone-700 underline">
          Volver al login
        </Link>
      </p>
    </form>
  );
}
