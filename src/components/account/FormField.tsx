import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

// Mismo estilo que los controles de @/components/ui (etiqueta arriba, ayuda debajo).
const LABEL_CLASS = "mb-2 block type-label text-text-primary";
// Sin outline-none: el foco visible lo da el anillo del sistema de diseño (focus-ring).
const INPUT_CLASS =
  "focus-ring w-full rounded-md border border-border-strong bg-surface-default px-4 py-3 type-body text-text-primary placeholder:text-text-tertiary transition-colors hover:border-text-primary motion-reduce:transition-none disabled:cursor-not-allowed disabled:border-border-default disabled:bg-surface-disabled disabled:text-text-tertiary read-only:bg-surface-muted";
const INVALID_CLASS = "border-2 border-status-error-border px-[15px] py-[11px]";
const HINT_CLASS = "-mt-1 mb-2 type-body-sm text-text-secondary";
const ERROR_CLASS = "mt-2 type-body-sm font-medium text-status-error-fg";

function describedBy(id: string | undefined, hint?: string, error?: string) {
  if (!id) return undefined;
  const ids = [hint ? `${id}-ayuda` : "", error ? `${id}-error` : ""].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

interface FormFieldBaseProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children?: ReactNode;
}

export function FormFieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={LABEL_CLASS}>
      {children}
      {required ? (
        <>
          <span className="ml-1 text-status-error-fg" aria-hidden>
            *
          </span>
          <span className="sr-only"> (obligatorio)</span>
        </>
      ) : null}
    </label>
  );
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  className = "",
  children,
}: FormFieldBaseProps) {
  return (
    <div className={className}>
      <FormFieldLabel htmlFor={htmlFor} required={required}>
        {label}
      </FormFieldLabel>
      {hint ? (
        <p id={htmlFor ? `${htmlFor}-ayuda` : undefined} className={HINT_CLASS}>
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className={ERROR_CLASS}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
};

export function FormInput({
  label,
  hint,
  error,
  id,
  name,
  required,
  containerClassName,
  inputClassName = "",
  ...inputProps
}: FormInputProps) {
  const fieldId = id ?? name;
  return (
    <FormField
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <input
        id={fieldId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={`${INPUT_CLASS} min-h-12 ${error ? INVALID_CLASS : ""} ${inputClassName}`}
        {...inputProps}
      />
    </FormField>
  );
}

type FormTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
> & {
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  textareaClassName?: string;
};

export function FormTextarea({
  label,
  hint,
  error,
  id,
  name,
  required,
  containerClassName,
  textareaClassName = "",
  ...textareaProps
}: FormTextareaProps) {
  const fieldId = id ?? name;
  return (
    <FormField
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <textarea
        id={fieldId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={`${INPUT_CLASS} ${error ? INVALID_CLASS : ""} ${textareaClassName}`}
        {...textareaProps}
      />
    </FormField>
  );
}

export const formControlClassName = INPUT_CLASS;
