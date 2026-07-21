"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import { HoneypotField } from "@/components/ui/HoneypotField";

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
    <form action={formAction} aria-busy={isPending} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <HoneypotField id="login-website" />
      <label htmlFor="login-email" className="block text-sm font-medium text-stone-700">
        Email
      </label>
      <input
        id="login-email"
        name="email"
        className="w-full rounded-xl border border-stone-200 px-4 py-3"
        placeholder="Email"
        type="email"
        maxLength={254}
        autoComplete="email"
        required
      />
      <label
        htmlFor="login-password"
        className="block text-sm font-medium text-stone-700"
      >
        Contraseña
      </label>
      <input
        id="login-password"
        name="password"
        className="w-full rounded-xl border border-stone-200 px-4 py-3"
        placeholder="Contraseña"
        type="password"
        maxLength={72}
        autoComplete="current-password"
        required
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
        disabled={isPending}
        className="w-full rounded-full bg-[#e6dac7] px-5 py-3 text-sm font-semibold text-stone-800 disabled:opacity-60"
      >
        {isPending ? "Ingresando…" : "Ingresar"}
      </button>
      <p className="text-center text-sm">
        <Link
          href="/recuperar"
          className="font-medium text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </form>
  );
}
