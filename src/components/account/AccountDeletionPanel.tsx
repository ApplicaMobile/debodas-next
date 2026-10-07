"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  accountDeletionAction,
  type AccountDeletionState,
} from "@/lib/account/actions/account-deletion";

interface AccountDeletionPanelProps {
  email: string;
  /** Si ya hay un código vigente, arrancamos en el paso 2. */
  initialStep: "form" | "code";
  initialResendAvailableAt?: number;
}

function SubmitButton({
  intent,
  label,
  pendingLabel,
  variant = "danger",
}: {
  intent: string;
  label: string;
  pendingLabel: string;
  variant?: "danger" | "secondary";
}) {
  const { pending, data } = useFormStatus();
  const mine = pending && data?.get("intent") === intent;
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50";
  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={pending}
      className={`${base} ${styles}`}
      formNoValidate={intent === "resend"}
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

export function AccountDeletionPanel({
  email,
  initialStep,
  initialResendAvailableAt,
}: AccountDeletionPanelProps) {
  const t = useTranslations();
  const [state, formAction] = useActionState<AccountDeletionState, FormData>(
    accountDeletionAction,
    { step: initialStep, resendAvailableAt: initialResendAvailableAt },
  );
  const resendIn = useSecondsUntil(state.resendAvailableAt);

  return (
    <section className="rounded-2xl border-2 border-red-200 bg-red-50/40 p-5 sm:p-6">
      <h3 className="font-serif text-lg font-semibold text-red-800">
        {t("accountDeletion.dangerTitle")}
      </h3>

      <div className="mt-4 rounded-xl border border-red-200 bg-white p-4" role="note">
        <p className="text-sm font-semibold text-red-700">{t("accountDeletion.legalTitle")}</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-stone-700">
          <li>{t("accountDeletion.itemMicrosite")}</li>
          <li>{t("accountDeletion.itemGuests")}</li>
          <li>{t("accountDeletion.itemGifts")}</li>
          <li>{t("accountDeletion.itemPhotos")}</li>
          <li>{t("accountDeletion.itemPlan")}</li>
          <li>{t("accountDeletion.itemPayments")}</li>
        </ul>
      </div>

      {state.error ? (
        <p className="mt-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.info ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {state.info}
        </p>
      ) : null}

      {state.step === "form" ? (
        <form action={formAction} className="mt-5 space-y-4" autoComplete="off">
          <div>
            <label htmlFor="del-password" className="block text-sm font-medium text-stone-700">
              {t("accountDeletion.passwordLabel")}
            </label>
            <input
              id="del-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full max-w-sm rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="del-confirm" className="block text-sm font-medium text-stone-700">
              {t("accountDeletion.confirmLabel")}
            </label>
            <input
              id="del-confirm"
              name="confirm_word"
              type="text"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="ELIMINAR"
              className="mt-1 w-full max-w-sm rounded-lg border border-stone-300 px-3 py-2 text-sm uppercase"
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-stone-800">
            <input type="checkbox" name="understand" required className="mt-0.5 h-4 w-4" />
            <span>{t("accountDeletion.checkboxLabel")}</span>
          </label>
          <SubmitButton
            intent="request"
            label={t("accountDeletion.sendCode")}
            pendingLabel={t("accountDeletion.sending")}
          />
        </form>
      ) : (
        <form action={formAction} className="mt-5 space-y-4" autoComplete="off">
          <p className="text-sm text-stone-600">
            {t("accountDeletion.emailLabel")}: <strong>{email}</strong>
          </p>
          <div>
            <label htmlFor="del-code" className="block text-sm font-medium text-stone-700">
              {t("accountDeletion.codeLabel")}
            </label>
            <input
              id="del-code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9 ]{6,7}"
              maxLength={7}
              required
              autoComplete="one-time-code"
              className="mt-1 w-40 rounded-lg border border-stone-300 px-3 py-2 text-center font-mono text-lg tracking-[0.3em]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton
              intent="confirm"
              label={t("accountDeletion.confirmDelete")}
              pendingLabel={t("accountDeletion.deleting")}
            />
            {resendIn > 0 ? (
              <span className="text-xs text-stone-500">
                {t("accountDeletion.resendIn", { seconds: resendIn })}
              </span>
            ) : (
              <SubmitButton
                intent="resend"
                variant="secondary"
                label={t("accountDeletion.resend")}
                pendingLabel={t("accountDeletion.sending")}
              />
            )}
          </div>
        </form>
      )}
    </section>
  );
}