"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { Alert, Button, Checkbox, Input, IconAlert } from "@/components/ui";
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
  return (
    <Button
      type="submit"
      name="intent"
      value={intent}
      variant={variant === "danger" ? "peligro" : "secundario"}
      size="md"
      loading={mine}
      loadingLabel={pendingLabel}
      disabled={pending && !mine}
      formNoValidate={intent === "resend"}
      className="w-full sm:w-auto"
    >
      {label}
    </Button>
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
    <section
      aria-labelledby="cuenta-eliminar"
      className="rounded-lg border-2 border-status-error-border bg-surface-default p-6 sm:p-8"
    >
      <div className="flex items-start gap-3">
        <span className="mt-1 shrink-0 text-status-error-fg" aria-hidden="true">
          <IconAlert size={24} />
        </span>
        <h3 id="cuenta-eliminar" className="type-h4 text-status-error-fg">
          {t("accountDeletion.dangerTitle")}
        </h3>
      </div>

      <div
        className="mt-5 rounded-md border border-status-error-border bg-status-error-bg p-4 sm:p-5"
        role="note"
      >
        <p className="type-label text-status-error-fg">{t("accountDeletion.legalTitle")}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 type-body-sm text-text-primary">
          <li>{t("accountDeletion.itemMicrosite")}</li>
          <li>{t("accountDeletion.itemGuests")}</li>
          <li>{t("accountDeletion.itemGifts")}</li>
          <li>{t("accountDeletion.itemPhotos")}</li>
          <li>{t("accountDeletion.itemPlan")}</li>
          <li>{t("accountDeletion.itemPayments")}</li>
        </ul>
      </div>

      {state.error ? (
        <Alert tone="error" title={state.error} className="mt-5" />
      ) : null}
      {state.info ? (
        <Alert tone="exito" title={state.info} className="mt-5" />
      ) : null}

      {state.step === "form" ? (
        <form action={formAction} className="mt-6 max-w-md space-y-5" autoComplete="off">
          <Input
            id="del-password"
            name="password"
            type="password"
            label={t("accountDeletion.passwordLabel")}
            required
            autoComplete="current-password"
          />
          <Input
            id="del-confirm"
            name="confirm_word"
            type="text"
            label={t("accountDeletion.confirmLabel")}
            required
            autoComplete="off"
            spellCheck={false}
            placeholder="ELIMINAR"
            inputClassName="uppercase"
          />
          <Checkbox
            id="del-understand"
            name="understand"
            required
            label={t("accountDeletion.checkboxLabel")}
          />
          <SubmitButton
            intent="request"
            label={t("accountDeletion.sendCode")}
            pendingLabel={t("accountDeletion.sending")}
          />
        </form>
      ) : (
        <form action={formAction} className="mt-6 space-y-5" autoComplete="off">
          <p className="break-words type-body-sm text-text-secondary">
            {t("accountDeletion.emailLabel")}:{" "}
            <strong className="break-all text-text-primary">{email}</strong>
          </p>
          <Input
            id="del-code"
            name="code"
            type="text"
            label={t("accountDeletion.codeLabel")}
            inputMode="numeric"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            required
            autoComplete="one-time-code"
            placeholder="000000"
            className="max-w-[16rem]"
            inputClassName="text-center font-mono text-2xl tracking-[0.35em]"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <SubmitButton
              intent="confirm"
              label={t("accountDeletion.confirmDelete")}
              pendingLabel={t("accountDeletion.deleting")}
            />
            {resendIn > 0 ? (
              <p className="type-body-sm text-text-secondary" aria-live="polite">
                {t("accountDeletion.resendIn", { seconds: resendIn })}
              </p>
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
