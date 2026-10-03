"use client";

import { useActionState } from "react";
import { updateOptionsAction } from "@/lib/account/actions/content";
import type { FormState } from "@/lib/account/form-state";
import { planLabels, normalizePlan } from "@/lib/plans/features";
import { getCurrentPlanFeatures } from "@/lib/plans/comparison";
import { FormAlert } from "@/components/account/FormAlert";
import { PlanComparison } from "@/components/account/PlanComparison";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  IconCheck,
  PaymentStatusBadge,
  PlanBadge,
  UsageMeter,
  type AlertTone,
  type MercadoPagoStatus,
} from "@/components/ui";
import { getPlanLimits } from "@/lib/plans/limits";

interface PlanPanelProps {
  plan: string;
  showFaq: boolean;
  showDressCode: boolean;
  isOnline: boolean;
  freeMount: boolean;
  hideGiftsList: boolean;
  mpConfigured: boolean;
  demoPlanSwitch: boolean;
  paymentNotice?: string | null;
  /** Mensaje (ya traducido) cuando no se pudo abrir el checkout tras el registro. */
  checkoutError?: string | null;
  giftCount: number;
  guestCount: number;
  pictureCount: number;
}

const initialState: FormState = {};

type PaymentNoticeKey = "success" | "pending" | "failure";

const PAYMENT_NOTICES: Record<
  PaymentNoticeKey,
  { tone: AlertTone; status: MercadoPagoStatus; title: string; body: string }
> = {
  success: {
    tone: "exito",
    status: "approved",
    title: "Pago recibido",
    body: "Si tu plan no se actualizó aún, aguardá unos segundos mientras confirmamos con MercadoPago.",
  },
  pending: {
    tone: "pendiente",
    status: "pending",
    title: "Tu pago está pendiente",
    body: "Te avisaremos cuando MercadoPago lo confirme. No hace falta que vuelvas a pagar.",
  },
  failure: {
    tone: "error",
    status: "rejected",
    title: "El pago no se completó",
    body: "Podés intentarlo nuevamente desde la comparación de planes.",
  },
};

/** Valores de ?payment= y estados de retorno de MercadoPago (?status=) → aviso. */
const PAYMENT_NOTICE_ALIASES: Record<string, PaymentNoticeKey> = {
  success: "success",
  approved: "success",
  pending: "pending",
  in_process: "pending",
  failure: "failure",
  rejected: "failure",
  cancelled: "failure",
};

export function PlanPanel({
  plan,
  showFaq,
  showDressCode,
  isOnline,
  freeMount,
  hideGiftsList,
  mpConfigured,
  demoPlanSwitch,
  paymentNotice,
  checkoutError,
  giftCount,
  guestCount,
  pictureCount,
}: PlanPanelProps) {
  const [state, formAction, isPending] = useActionState(
    updateOptionsAction,
    initialState,
  );
  const normalized = normalizePlan(plan);
  const label = planLabels[plan] ?? planLabels[normalized];
  const features = getCurrentPlanFeatures(plan);
  const limits = getPlanLimits(plan);
  const noticeKey = paymentNotice
    ? PAYMENT_NOTICE_ALIASES[paymentNotice]
    : undefined;
  const notice = noticeKey ? PAYMENT_NOTICES[noticeKey] : null;

  return (
    <div className="space-y-10">
      {notice ? (
        <Alert
          tone={notice.tone}
          title={
            <span className="flex flex-wrap items-center gap-2">
              {notice.title}
              <PaymentStatusBadge status={notice.status} />
            </span>
          }
        >
          {notice.body}
        </Alert>
      ) : null}

      {checkoutError ? (
        <Alert tone="error" title="No pudimos abrir el pago">
          {checkoutError}
        </Alert>
      ) : null}

      <Card as="section" aria-labelledby="plan-actual" padding="lg">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="type-overline text-text-accent">Plan actual</p>
            <div className="flex flex-wrap items-center gap-3">
              <h3 id="plan-actual" className="type-h3 text-text-primary">
                {label}
              </h3>
              <PlanBadge plan={normalized} />
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2" role="list">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <IconCheck
                  size={20}
                  className="mt-[3px] shrink-0 text-status-success-fg"
                />
                <span className="type-body text-text-primary">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            <UsageMeter
              label="Regalos"
              value={giftCount}
              max={limits.maxGifts}
              unit="regalos"
              upgradeHref="#comparar-planes"
            />
            <UsageMeter
              label="Invitados (RSVP)"
              value={guestCount}
              max={limits.maxRsvpGuests}
              unit="invitados"
              upgradeHref="#comparar-planes"
            />
            <UsageMeter
              label="Fotos del álbum"
              value={pictureCount}
              max={limits.maxPictures}
              unit="fotos"
              upgradeHref="#comparar-planes"
            />
          </div>
        </div>
      </Card>

      <PlanComparison
        currentPlan={plan}
        mpConfigured={mpConfigured}
        demoPlanSwitch={demoPlanSwitch}
      />

      <Card as="section" aria-labelledby="opciones-micrositio" padding="lg">
        <h3 id="opciones-micrositio" className="type-h4 text-text-primary">
          Opciones del micrositio
        </h3>
        <form action={formAction} className="mt-4 space-y-2">
          <Checkbox
            name="is_online"
            defaultChecked={isOnline}
            label="Micrositio online (visible / activo)"
          />
          <Checkbox
            name="show_faq"
            defaultChecked={showFaq}
            label="Mostrar sección FAQ en el micrositio"
          />
          <Checkbox
            name="show_dress_code"
            defaultChecked={showDressCode}
            label="Mostrar sección Dress Code en el micrositio"
          />
          {normalized === "premium" ? (
            <Checkbox
              name="free_mount"
              defaultChecked={freeMount}
              label="Permitir regalo con monto libre"
            />
          ) : freeMount ? (
            <input type="hidden" name="free_mount" value="on" />
          ) : null}
          <Checkbox
            name="hide_gifts_list"
            defaultChecked={hideGiftsList}
            label="Ocultar la lista de regalos en el micrositio"
          />
          <div className="space-y-4 pt-4">
            <FormAlert error={state.error} success={state.success} />
            <Button
              type="submit"
              variant="secundario"
              loading={isPending}
              loadingLabel="Guardando…"
            >
              Guardar opciones
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
