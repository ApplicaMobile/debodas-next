import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconCheck, IconClock, IconInfo, IconStar, IconX } from "./icons";

export type BadgeTone =
  | "aprobado"
  | "pendiente"
  | "rechazado"
  | "info"
  | "neutro"
  | "free"
  | "basico"
  | "premium"
  | "recomendado";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone: BadgeTone;
  children: ReactNode;
  /** Ícono por defecto según el tono; `false` lo oculta. */
  icon?: ReactNode | false;
};

const tones: Record<BadgeTone, string> = {
  // Estados (radius/sm). Nunca verde para pendiente o rechazado.
  aprobado: "rounded-sm border border-status-success-border bg-status-success-bg text-status-success-fg",
  pendiente: "rounded-sm border border-status-warning-border bg-status-warning-bg text-status-warning-fg",
  rechazado: "rounded-sm border border-status-error-border bg-status-error-bg text-status-error-fg",
  info: "rounded-sm border border-status-info-border bg-status-info-bg text-status-info-fg",
  neutro: "rounded-sm border border-border-default bg-surface-muted text-text-secondary",
  // Planes (radius/full)
  free: "rounded-full border border-border-subtle bg-plan-free-bg text-plan-free-fg",
  basico: "rounded-full bg-plan-basico-bg text-plan-basico-fg",
  premium: "rounded-full bg-plan-premium-bg text-plan-premium-fg",
  recomendado: "rounded-full bg-plan-recomendado-bg text-plan-recomendado-fg",
};

const defaultIcons: Partial<Record<BadgeTone, ReactNode>> = {
  aprobado: <IconCheck size={14} strokeWidth={2.5} />,
  pendiente: <IconClock size={14} strokeWidth={2.5} />,
  rechazado: <IconX size={14} strokeWidth={2.5} />,
  info: <IconInfo size={14} strokeWidth={2.5} />,
  recomendado: <IconStar size={14} strokeWidth={2.5} />,
};

/** Etiqueta corta de estado o plan. El texto siempre acompaña al color (no depende solo del color). */
export function Badge({ tone, icon, className, children, ...props }: BadgeProps) {
  const shownIcon = icon === false ? null : (icon ?? defaultIcons[tone]);
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap px-2 py-1 type-caption font-semibold",
        tones[tone],
        className,
      )}
    >
      {shownIcon ? <span aria-hidden="true" className="inline-flex">{shownIcon}</span> : null}
      {children}
    </span>
  );
}

/** Estados de MercadoPago → estado visible para la pareja. */
export type MercadoPagoStatus =
  | "approved"
  | "authorized"
  | "pending"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

const paymentMap: Record<MercadoPagoStatus, { tone: BadgeTone; label: string }> = {
  approved: { tone: "aprobado", label: "Aprobado" },
  authorized: { tone: "aprobado", label: "Aprobado" },
  pending: { tone: "pendiente", label: "Pendiente" },
  in_process: { tone: "pendiente", label: "En revisión" },
  in_mediation: { tone: "pendiente", label: "En mediación" },
  rejected: { tone: "rechazado", label: "Rechazado" },
  cancelled: { tone: "rechazado", label: "Cancelado" },
  refunded: { tone: "neutro", label: "Devuelto" },
  charged_back: { tone: "rechazado", label: "Contracargo" },
};

export function PaymentStatusBadge({ status, className }: { status: MercadoPagoStatus; className?: string }) {
  const { tone, label } = paymentMap[status];
  return (
    <Badge tone={tone} className={className}>
      <span className="sr-only">Estado del pago: </span>
      {label}
    </Badge>
  );
}

export type PlanId = "free" | "basico" | "premium";
export const planLabels: Record<PlanId, string> = { free: "Free", basico: "Básico", premium: "Premium" };

export function PlanBadge({ plan, className }: { plan: PlanId; className?: string }) {
  return (
    <Badge tone={plan} className={className}>
      <span className="sr-only">Plan </span>
      {planLabels[plan]}
    </Badge>
  );
}
