"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  unlockMicrositeAction,
  type UnlockState,
} from "@/lib/microsite/actions/unlock";

interface PasswordGateProps {
  slug: string;
  coupleName: string;
}

const initialState: UnlockState = {};

export function PasswordGate({ slug, coupleName }: PasswordGateProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    unlockMicrositeAction,
    initialState,
  );
  const refreshed = useRef(false);

  useEffect(() => {
    if (state.success && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3eb] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
          DeBodas
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-stone-800">
          {coupleName}
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          Este micrositio está protegido. Ingresá la contraseña que te
          compartieron los novios.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <label className="block text-sm font-medium text-stone-700">
            Contraseña
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3"
              placeholder="••••••••"
            />
          </label>

          {state.error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-[#e6dac7] px-5 py-3 text-sm font-semibold text-stone-800 disabled:opacity-60"
          >
            {isPending ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
