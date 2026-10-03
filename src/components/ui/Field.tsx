"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconAlert } from "./icons";

export interface FieldBaseProps {
  /** Etiqueta visible arriba del campo (obligatoria: nunca usar solo placeholder). */
  label: ReactNode;
  /** Texto de ayuda debajo de la etiqueta. */
  hint?: ReactNode;
  /** Mensaje de error. Activa aria-invalid y se anuncia vía aria-describedby. */
  error?: ReactNode;
  /** Marca el campo como obligatorio (visible y para lectores de pantalla). */
  required?: boolean;
  /** Muestra "(opcional)" junto a la etiqueta. */
  optional?: boolean;
  id?: string;
  className?: string;
}

export interface FieldRenderProps {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
}

/** Envoltorio común: etiqueta arriba, ayuda, control y error. */
export function Field({
  label,
  hint,
  error,
  required,
  optional,
  id: idProp,
  className,
  children,
}: FieldBaseProps & { children: (field: FieldRenderProps) => ReactNode }) {
  const autoId = useId();
  const id = idProp ?? `campo-${autoId}`;
  const hintId = hint ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="type-label text-text-primary">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-1 text-status-error-fg">*</span>
            <span className="sr-only"> (obligatorio)</span>
          </>
        ) : null}
        {optional && !required ? (
          <span className="ml-1 font-normal text-text-secondary">(opcional)</span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="-mt-1 type-body-sm text-text-secondary">
          {hint}
        </p>
      ) : null}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} className="flex items-start gap-2 type-body-sm font-medium text-status-error-fg">
          <IconAlert size={16} className="mt-[3px] shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

/** Clases compartidas por Input, Textarea y Select. */
export function controlClasses({ invalid, demoFocus }: { invalid: boolean; demoFocus?: boolean }) {
  return cn(
    "focus-ring w-full rounded-md border bg-surface-default px-4 py-3 type-body text-text-primary",
    "placeholder:text-text-tertiary transition-colors motion-reduce:transition-none",
    "disabled:cursor-not-allowed disabled:border-border-default disabled:bg-surface-disabled disabled:text-text-tertiary",
    "read-only:bg-surface-muted",
    invalid
      ? "border-2 border-status-error-border px-[15px] py-[11px]"
      : "border-border-strong hover:border-text-primary",
    demoFocus && "border-text-primary",
  );
}
