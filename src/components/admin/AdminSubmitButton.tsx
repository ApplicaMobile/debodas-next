"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  IconTrash,
  Spinner,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui";
import { cn } from "@/lib/cn";

/** Variantes del sistema + "eliminar" (texto rojo con ícono, para filas de tablas). */
export type AdminSubmitVariant = ButtonVariant | "eliminar";

interface AdminSubmitButtonProps {
  idleLabel: string;
  pendingLabel?: string;
  className?: string;
  /** Sin variante se mantiene el estilo que llegue por `className`. */
  variant?: AdminSubmitVariant;
  /** sm (44px táctil) por defecto. */
  size?: ButtonSize;
  icon?: ReactNode;
  fullWidth?: boolean;
}

/** Botón de envío para formularios del admin: se bloquea y muestra el progreso mientras se procesa. */
export function AdminSubmitButton({
  idleLabel,
  pendingLabel = "Guardando…",
  className,
  variant,
  size = "sm",
  icon,
  fullWidth,
}: AdminSubmitButtonProps) {
  const { pending } = useFormStatus();

  if (!variant) {
    return (
      <button
        type="submit"
        disabled={pending}
        aria-disabled={pending}
        className={`${className ?? ""} disabled:cursor-wait disabled:opacity-60`}
      >
        {pending ? pendingLabel : idleLabel}
      </button>
    );
  }

  if (variant === "eliminar") {
    return (
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className={cn(
          "focus-ring inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 type-button-sm text-status-error-fg transition-colors hover:bg-status-error-bg disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none",
          className,
        )}
      >
        {pending ? <Spinner size={16} /> : <IconTrash size={16} />}
        <span>{pending ? pendingLabel : idleLabel}</span>
      </button>
    );
  }

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      loading={pending}
      loadingLabel={pendingLabel}
      icon={icon}
      fullWidth={fullWidth}
      className={className}
    >
      {idleLabel}
    </Button>
  );
}
