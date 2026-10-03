"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconAlert, IconCheck } from "./icons";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  label: ReactNode;
  /** Descripción secundaria debajo de la etiqueta. */
  description?: ReactNode;
  error?: ReactNode;
  className?: string;
  demoFocus?: boolean;
};

/**
 * Checkbox nativo (teclado y formularios sin JS) con estilo de marca.
 * Área táctil de 44px gracias al label completo clickeable.
 */
export function Checkbox({ label, description, error, id: idProp, className, demoFocus, disabled, ...props }: CheckboxProps) {
  const autoId = useId();
  const id = idProp ?? `check-${autoId}`;
  const descId = description ? `${id}-desc` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={id}
        className={cn(
          "group flex min-h-11 items-start gap-3 py-2",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <span className="relative mt-[3px] inline-flex size-5 shrink-0">
          <input
            {...props}
            id={id}
            type="checkbox"
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            data-demo-focus={demoFocus ? "" : undefined}
            className={cn(
              "focus-ring peer size-5 cursor-[inherit] appearance-none rounded-sm border-2 bg-surface-default transition-colors motion-reduce:transition-none",
              "checked:border-action-primary-bg checked:bg-action-primary-bg",
              "disabled:border-border-default disabled:bg-surface-disabled disabled:checked:bg-action-disabled-fg disabled:checked:border-action-disabled-fg",
              error ? "border-status-error-border" : "border-border-strong group-hover:border-text-primary",
            )}
          />
          <IconCheck
            size={14}
            strokeWidth={3}
            className="pointer-events-none absolute left-[3px] top-[3px] text-action-primary-fg opacity-0 peer-checked:opacity-100"
          />
        </span>
        <span className="flex flex-col gap-1">
          <span className={cn("type-body", disabled ? "text-text-tertiary" : "text-text-primary")}>{label}</span>
          {description ? (
            <span id={descId} className="type-body-sm text-text-secondary">
              {description}
            </span>
          ) : null}
        </span>
      </label>
      {error ? (
        <p id={errorId} className="ml-8 flex items-start gap-2 type-body-sm font-medium text-status-error-fg">
          <IconAlert size={16} className="mt-[3px] shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
