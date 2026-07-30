"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  resetPasswordAction,
  type PasswordResetState,
} from "@/lib/auth/password-reset";
import { PasswordField } from "@/components/ui/PasswordField";

const initialState: PasswordResetState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  if (state.success) {
    return (
      <div className="mt-8 space-y-4 text-center">
        <p
          role="status"
          aria-live="polite"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {state.success}
        </p>
        <Link
          href="/login"
          className="inline-block rounded-full bg-[#e6dac7] px-6 py-3 text-sm font-semibold text-stone-800"
        >
          Ir a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form action={action} aria-busy={pending} className="mt-8 space-y-4">
      <input type="hidden" name="token" value={token} />
      <label
        htmlFor="reset-password"
        className="block text-sm font-medium text-stone-700"
      >
        Nueva contraseña
      </label>
      <PasswordField
        id="reset-password"
        name="password"
        required
        minLength={8}
        maxLength={72}
        autoComplete="new-password"
        placeholder="Nueva contraseña (mín. 8)"
      />
      <label
        htmlFor="reset-password-confirm"
        className="block text-sm font-medium text-stone-700"
      >
        Repetir contraseña
      </label>
      <PasswordField
        id="reset-password-confirm"
        name="password_confirm"
        required
        minLength={8}
        maxLength={72}
        autoComplete="new-password"
        placeholder="Repetir contraseña"
      />
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#e6dac7] px-5 py-3 text-sm font-semibold text-stone-800 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
