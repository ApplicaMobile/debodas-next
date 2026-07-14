"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { loginAction, type LoginState } from "@/lib/auth/actions";

interface LoginFormProps {
  nextPath?: string;
}

const initialState: LoginState = {};

export function LoginForm({ nextPath = "/mi-cuenta" }: LoginFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state.success, state.redirectTo, router]);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <input
        name="email"
        className="w-full rounded-xl border border-stone-200 px-4 py-3"
        placeholder="Email"
        type="email"
        autoComplete="email"
        required
        defaultValue="demo@debodas.local"
      />
      <input
        name="password"
        className="w-full rounded-xl border border-stone-200 px-4 py-3"
        placeholder="Contraseña"
        type="password"
        autoComplete="current-password"
        required
      />
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[#556B2F] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
