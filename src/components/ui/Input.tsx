"use client";

import type { InputHTMLAttributes } from "react";
import { Field, controlClasses, type FieldBaseProps } from "./Field";

export type InputProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> & {
    inputClassName?: string;
    /** Solo para la guía de estilos: muestra el anillo de foco. */
    demoFocus?: boolean;
  };

export function Input({
  label, hint, error, required, optional, id, className, inputClassName, demoFocus,
  type = "text",
  ...props
}: InputProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} optional={optional} id={id} className={className}>
      {({ id: fieldId, describedBy, invalid }) => (
        <input
          {...props}
          id={fieldId}
          type={type}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          data-demo-focus={demoFocus ? "" : undefined}
          className={[controlClasses({ invalid, demoFocus }), "min-h-12", inputClassName].filter(Boolean).join(" ")}
        />
      )}
    </Field>
  );
}
