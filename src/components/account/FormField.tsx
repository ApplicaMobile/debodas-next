import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-stone-700";
const INPUT_CLASS =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#e6dac7] focus:outline-none focus:ring-2 focus:ring-[#e6dac7]/25";
const HINT_CLASS = "mt-1 text-xs text-stone-500";
const ERROR_CLASS = "mt-1 text-xs font-medium text-red-700";

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
        <span className="text-red-600" aria-hidden>
          {" "}
          *
        </span>
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
      {children}
      {error ? <p className={ERROR_CLASS}>{error}</p> : null}
      {!error && hint ? <p className={HINT_CLASS}>{hint}</p> : null}
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
        className={`${INPUT_CLASS} ${error ? "border-red-300" : ""} ${inputClassName}`}
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
        className={`${INPUT_CLASS} ${error ? "border-red-300" : ""} ${textareaClassName}`}
        {...textareaProps}
      />
    </FormField>
  );
}

export const formControlClassName = INPUT_CLASS;
