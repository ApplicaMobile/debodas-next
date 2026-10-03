import { useId } from "react";
import { cn } from "@/lib/cn";

export interface UsageMeterProps {
  label: string;
  value: number;
  /** null = ilimitado. */
  max: number | null;
  /** Unidad para el texto, p. ej. "regalos". */
  unit: string;
  /** Link a planes cuando está cerca del límite. */
  upgradeHref?: string;
  className?: string;
}

/** Medidor de uso del plan. role="progressbar" + texto de estado (no depende solo del color). */
export function UsageMeter({ label, value, max, unit, upgradeHref, className }: UsageMeterProps) {
  const labelId = `uso-${useId()}`;
  const unlimited = max === null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((value / max) * 100));
  const atLimit = !unlimited && value >= max;
  const nearLimit = !unlimited && !atLimit && pct >= 80;
  const remaining = unlimited ? null : Math.max(0, max - value);

  const status = unlimited
    ? `${value} ${unit} · Ilimitado`
    : atLimit
      ? "Límite alcanzado"
      : nearLimit
        ? `Te quedan ${remaining}`
        : `${remaining} disponibles`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <span id={labelId} className="type-label text-text-primary">{label}</span>
        <span className="type-body-sm tabular-nums text-text-secondary">
          {unlimited ? "Ilimitado" : `${value} de ${max}`}
        </span>
      </div>
      {!unlimited ? (
        <div
          role="progressbar"
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} de ${max} ${unit}. ${status}`}
          className="h-2 w-full overflow-hidden rounded-full bg-surface-disabled"
        >
          <div
            className={cn(
              "h-full rounded-full",
              atLimit ? "bg-status-error-border" : nearLimit ? "bg-status-warning-border" : "bg-action-primary-bg",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
      <p
        className={cn(
          "type-body-sm",
          atLimit ? "font-semibold text-status-error-fg" : nearLimit ? "font-semibold text-status-warning-fg" : "text-text-secondary",
        )}
      >
        {status}
        {(atLimit || nearLimit) && upgradeHref ? (
          <>
            {" · "}
            <a href={upgradeHref} className="focus-ring rounded-sm text-text-link underline underline-offset-2">
              {atLimit ? "Mejorá tu plan" : "Ver planes"}
            </a>
          </>
        ) : null}
      </p>
    </div>
  );
}
