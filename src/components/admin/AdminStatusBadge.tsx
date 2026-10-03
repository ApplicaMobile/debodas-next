import {
  Badge,
  PlanBadge,
  planLabels,
  type BadgeTone,
  type PlanId,
} from "@/components/ui";
import type { HealthLevel } from "@/lib/admin/system-health";

/**
 * Estados del panel admin como Badge del sistema (color + ícono + texto).
 * Se muestra el valor técnico (el mismo que usan los filtros) para que
 * coincida con lo que se busca y con los registros.
 */
export type AdminStatusKind = "email" | "rating" | "payment" | "migration";

const tones: Record<AdminStatusKind, Record<string, BadgeTone>> = {
  email: {
    sent: "aprobado",
    queued: "info",
    processing: "info",
    retry: "info",
    skipped: "pendiente",
    blocked: "pendiente",
    failed: "rechazado",
    cancelled: "rechazado",
  },
  rating: {
    approved: "aprobado",
    pending: "pendiente",
    rejected: "rechazado",
  },
  payment: {
    approved: "aprobado",
    authorized: "aprobado",
    pending: "pendiente",
    in_process: "pendiente",
    in_mediation: "pendiente",
    rejected: "rechazado",
    cancelled: "rechazado",
    charged_back: "rechazado",
    refunded: "neutro",
  },
  migration: {
    migrada: "aprobado",
    pendiente: "pendiente",
  },
};

const srPrefix: Record<AdminStatusKind, string> = {
  email: "Estado del envío: ",
  rating: "Estado de la calificación: ",
  payment: "Estado del pago: ",
  migration: "Estado de la migración: ",
};

export function AdminStatusBadge({
  kind,
  status,
  className,
}: {
  kind: AdminStatusKind;
  status: string;
  className?: string;
}) {
  const tone = tones[kind][status] ?? "neutro";
  return (
    <Badge tone={tone} className={className}>
      <span className="sr-only">{srPrefix[kind]}</span>
      {status}
    </Badge>
  );
}

const healthMap: Record<HealthLevel, { tone: BadgeTone; label: string }> = {
  ok: { tone: "aprobado", label: "OK" },
  warn: { tone: "pendiente", label: "Atención" },
  error: { tone: "rechazado", label: "Error" },
  unknown: { tone: "neutro", label: "Sin datos" },
};

/** Nivel de salud del sistema (Estado del sistema). */
export function AdminHealthBadge({
  level,
  className,
}: {
  level: HealthLevel;
  className?: string;
}) {
  const { tone, label } = healthMap[level] ?? healthMap.unknown;
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}

/** Plan de una boda: PlanBadge si es un plan conocido; si no, el valor tal cual. */
export function AdminPlanBadge({
  plan,
  className,
}: {
  plan: string;
  className?: string;
}) {
  if (Object.prototype.hasOwnProperty.call(planLabels, plan)) {
    return <PlanBadge plan={plan as PlanId} className={className} />;
  }
  return (
    <Badge tone="neutro" icon={false} className={className}>
      <span className="sr-only">Plan </span>
      {plan || "—"}
    </Badge>
  );
}
