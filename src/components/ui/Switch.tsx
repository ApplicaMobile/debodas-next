"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SwitchProps {
  label: ReactNode;
  description?: ReactNode;
  /** Controlado. */
  checked?: boolean;
  /** No controlado. */
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Si se pasa, envía "on" en formularios (como un checkbox) mediante un input oculto. */
  name?: string;
  /** Texto de estado visible (ayuda a no depender solo del color). */
  stateLabels?: { on: string; off: string };
  id?: string;
  className?: string;
  demoFocus?: boolean;
}

/** Interruptor accesible: <button role="switch" aria-checked>. Para cambios que aplican al instante. */
export function Switch({
  label,
  description,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  name,
  stateLabels = { on: "Activado", off: "Desactivado" },
  id: idProp,
  className,
  demoFocus,
}: SwitchProps) {
  const autoId = useId();
  const id = idProp ?? `switch-${autoId}`;
  const [internal, setInternal] = useState(defaultChecked);
  const isControlled = checkedProp !== undefined;
  const checked = isControlled ? checkedProp : internal;

  const toggle = () => {
    if (disabled) return;
    const next = !checked;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  };

  return (
    <div className={cn("flex min-h-11 items-start justify-between gap-4 py-2", className)}>
      <div className="flex flex-col gap-1">
        <label
          id={`${id}-label`}
          htmlFor={id}
          className={cn("type-body", disabled ? "cursor-not-allowed text-text-tertiary" : "cursor-pointer text-text-primary")}
        >
          {label}
        </label>
        {description ? (
          <span id={`${id}-desc`} className="type-body-sm text-text-secondary">
            {description}
          </span>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span aria-hidden="true" className={cn("type-caption", disabled ? "text-text-tertiary" : "text-text-secondary")}>
          {checked ? stateLabels.on : stateLabels.off}
        </span>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${id}-label`}
          aria-describedby={description ? `${id}-desc` : undefined}
          disabled={disabled}
          onClick={toggle}
          data-demo-focus={demoFocus ? "" : undefined}
          className={cn(
            "focus-ring relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors motion-reduce:transition-none",
            disabled
              ? "cursor-not-allowed border-action-disabled-bg bg-action-disabled-bg"
              : checked
                ? "cursor-pointer border-action-primary-bg bg-action-primary-bg hover:border-action-primary-bg-hover hover:bg-action-primary-bg-hover"
                : "cursor-pointer border-border-strong bg-border-strong hover:border-text-secondary hover:bg-text-secondary",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "inline-block size-5 rounded-full bg-surface-default shadow-elevation-1 transition-transform motion-reduce:transition-none",
              checked ? "translate-x-[22px]" : "translate-x-[2px]",
            )}
          />
        </button>
        {name ? <input type="hidden" name={name} value={checked ? "on" : ""} disabled={!checked} /> : null}
      </div>
    </div>
  );
}
