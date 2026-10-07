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
  const styles =
    variant === "primary"
      ? "bg-[#06263a] text-white hover:bg-[#0a3550]"
      : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50";
  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={pending}
      formNoValidate={intent === "resend"}
      className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles}`}
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
    <form action={formAction} className="mt-6 space-y-4" autoComplete="off">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.info ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {state.info}
        </p>
      ) : null}
      {showNoCode ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
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
          className="mt-1 w-44 rounded-lg border border-stone-300 px-3 py-2 text-center font-mono text-xl tracking-[0.3em]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          intent="confirm"
          label={redirecting ? t("emailVerification.verifying") : t("emailVerification.submit")}
          pendingLabel={t("emailVerification.verifying")}
        />
        {resendIn > 0 ? (
          <span className="text-xs text-stone-500">
            {t("emailVerification.resendIn", { seconds: resendIn })}
          </span>
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