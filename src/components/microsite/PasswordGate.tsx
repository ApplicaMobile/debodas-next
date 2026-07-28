"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state.success && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="absolute inset-0 bg-[#f7f3eb]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(230,218,199,0.95),transparent_42%),radial-gradient(circle_at_85%_80%,rgba(6,38,58,0.08),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#06263a]/10 to-transparent" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(45,45,45,0.08)] backdrop-blur-sm sm:p-8">
        <p className="font-serif text-2xl font-semibold tracking-tight text-stone-800">
          DeBodas
        </p>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-stone-800 sm:text-3xl">
          {coupleName}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Este micrositio está protegido. Pedile la contraseña a los novios si no
          la tenés — suele estar en la invitación o en el mensaje de WhatsApp.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <label className="block text-sm font-medium text-stone-700">
            Contraseña
            <div className="relative mt-2">
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                enterKeyHint="go"
                required
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3.5 pr-20 text-base"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-2 my-auto rounded-lg px-3 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>

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
            className="w-full rounded-full bg-[#e6dac7] px-5 py-3.5 text-sm font-semibold text-stone-800 transition hover:bg-[#d4c4a8] disabled:opacity-60"
          >
            {isPending ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
