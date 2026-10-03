"use client";

import type { TextareaHTMLAttributes } from "react";
import { Field, controlClasses, type FieldBaseProps } from "./Field";

export type TextareaProps = FieldBaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> & {
    textareaClassName?: string;
    demoFocus?: boolean;
  };

export function Textarea({
  label, hint, error, required, optional, id, className, textareaClassName, demoFocus,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} optional={optional} id={id} className={className}>
      {({ id: fieldId, describedBy, invalid }) => (
        <textarea
          {...props}
          id={fieldId}
          rows={rows}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          data-demo-focus={demoFocus ? "" : undefined}
          className={[controlClasses({ invalid, demoFocus }), "resize-y", textareaClassName].filter(Boolean).join(" ")}
        />
      )}
    </Field>
  );
}
