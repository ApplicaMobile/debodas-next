"use client";

import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Field, controlClasses, type FieldBaseProps } from "./Field";
import { IconChevronDown } from "./icons";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectProps = FieldBaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className" | "children"> & {
    options: SelectOption[];
    /** Opción vacía inicial (p. ej. "Elegí una opción"). */
    placeholder?: string;
    demoFocus?: boolean;
  };

/** Select nativo (mejor accesibilidad y teclado móvil) con estilo de marca. */
export function Select({
  label, hint, error, required, optional, id, className, options, placeholder, demoFocus,
  ...props
}: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} optional={optional} id={id} className={className}>
      {({ id: fieldId, describedBy, invalid }) => (
        <div className="relative">
          <select
            {...props}
            id={fieldId}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            data-demo-focus={demoFocus ? "" : undefined}
            defaultValue={props.value === undefined && props.defaultValue === undefined && placeholder ? "" : props.defaultValue}
            className={cn(controlClasses({ invalid, demoFocus }), "min-h-12 cursor-pointer appearance-none pr-12")}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>
          <IconChevronDown
            size={20}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"
          />
        </div>
      )}
    </Field>
  );
}
