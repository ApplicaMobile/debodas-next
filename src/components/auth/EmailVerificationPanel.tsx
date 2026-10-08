"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  emailVerificationAction,
  type EmailVerificationState,
} from "@/lib/auth/email-verification-actions";

interface EmailVerificationPanelProps {
  hasPendingCode: boolean;
  initialResendAvailableAt?: number;
}

function SubmitButton({
  intent,
  label,
  pendingLabel,
  variant = "primary",
}: {
  intent: "confirm" | "resend";
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary";
}) {
  const { pending, data } = useFormStatus();
  const mine = pending && data?.get("intent") === intent;
  // Mismo lenguaje que el login: CTA beige a todo el ancho y secundario con borde.
  const styles =
    variant === "primary"
      ? "w-full bg-[#e6dac7] text-stone-800 hover:bg-[#dccdb5]"
      : "w-full border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 sm:w-auto";
  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={pending}
      formNoValidate={intent === "resend"}
      aria-busy={mine || undefined}
      className={`focus-ring inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles}`}
    >
      {mine ? pendingLabel : label}
    </button>
  );
}

function useSecondsUntil(target?: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target || target <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target]);
  if (!target) return 0;
  return Math.max(0, Math.ceil((target - now) / 1000));
}

export function EmailVerificationPanel({
  hasPendingCode,
  initialResendAvailableAt,
}: EmailVerificationPanelProps) {
  const t = useTranslations();
  const [state, formAction] = useActionState<EmailVerificationState, FormData>(
    emailVerificationAction,
    { resendAvailableAt: initialResendAvailableAt },
  );
  const resendIn = useSecondsUntil(state.resendAvailableAt);
  const redirecting = Boolean(state.redirectTo);
  const showNoCode = !hasPendingCode && !state.info && !state.error;

  useEffect(() => {
    if (state.redirectTo) {
      window.location.replace(state.redirectTo);
    }
  }, [state.redirectTo]);

  return (
    <form action={formAction} className="mt-8 space-y-5" autoComplete="off">
      {state.error ? (
        <p
          id="verify-code-error"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.info ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          {state.info}
        </p>
      ) : null}
      {showNoCode ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {t("emailVerification.noCode")}
        </p>
      ) : null}

      <div>
        <label htmlFor="verify-code" className="block text-sm font-medium text-stone-700">
          {t("emailVerification.codeLabel")}
        </label>
        <input
          id="verify-code"
          name="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
          autoComplete="one-time-code"
          aria-describedby={state.error ? "verify-code-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          placeholder="000000"
          className="focus-ring mt-2 block min-h-14 w-full max-w-[16rem] rounded-xl border border-stone-200 bg-white px-4 py-3 text-center font-mono text-2xl tracking-[0.35em] text-stone-800 placeholder:text-stone-300"
        />
      </div>

      <div className="space-y-3">
        <SubmitButton
          intent="confirm"
          label={redirecting ? t("emailVerification.verifying") : t("emailVerification.submit")}
          pendingLabel={t("emailVerification.verifying")}
        />
        {resendIn > 0 ? (
          <p className="text-center text-sm text-stone-500 sm:text-left" aria-live="polite">
            {t("emailVerification.resendIn", { seconds: resendIn })}
          </p>
        ) : (
          <SubmitButton
            intent="resend"
            variant="secondary"
            label={hasPendingCode || state.info ? t("emailVerification.resend") : t("emailVerification.sendCode")}
            pendingLabel={t("emailVerification.sending")}
          />
        )}
      </div>
    </form>
  );
}