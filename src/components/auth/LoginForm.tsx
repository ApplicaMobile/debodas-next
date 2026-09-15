"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import { HoneypotField } from "@/components/ui/HoneypotField";
import { PasswordField } from "@/components/ui/PasswordField";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface LoginFormProps {
  nextPath?: string;
}

const initialState: LoginState = {};

export function LoginForm({ nextPath = "/mi-cuenta" }: LoginFormProps) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  useEffect(() => {
    if (state.success && state.redirectTo) {
      window.location.replace(state.redirectTo);
    }
  }, [state.success, state.redirectTo]);

  const errorMessage =
    state.errorCode === "too_many"
      ? t("auth.tooMany", { seconds: state.retryAfter ?? 0 })
      : state.errorCode === "db"
        ? t("auth.dbError")
        : state.errorCode === "invalid"
          ? t("auth.invalid")
          : state.error;

  return (
    <form action={formAction} aria-busy={isPending} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <HoneypotField id="login-website" />
      <label htmlFor="login-email" className="block text-sm font-medium text-stone-700">
        {t("auth.email")}
      </label>
      <input
        id="login-email"
        name="email"
        className="w-full rounded-xl border border-stone-200 px-4 py-3"
        placeholder={t("auth.email")}
        type="email"
        maxLength={254}
        autoComplete="email"
        required
      />
      <label
        htmlFor="login-password"
        className="block text-sm font-medium text-stone-700"
      >
        {t("auth.password")}
      </label>
      <PasswordField
        id="login-password"
        name="password"
        placeholder={t("auth.password")}
        maxLength={72}
        autoComplete="current-password"
        required
      />
      {errorMessage ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[#e6dac7] px-5 py-3 text-sm font-semibold text-stone-800 disabled:opacity-60"
      >
        {isPending ? t("auth.submitting") : t("auth.submit")}
      </button>
      <p className="text-center text-sm">
        <Link
          href="/recuperar"
          className="font-medium text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline"
        >
          {t("auth.forgot")}
        </Link>
      </p>
    </form>
  );
}
