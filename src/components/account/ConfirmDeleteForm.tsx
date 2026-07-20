"use client";

import type { FormHTMLAttributes, ReactNode } from "react";

interface ConfirmDeleteFormProps
  extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  action: (formData: FormData) => void | Promise<void>;
  message?: string;
  children: ReactNode;
}

export function ConfirmDeleteForm({
  action,
  message = "¿Seguro que querés eliminar este elemento?",
  children,
  ...props
}: ConfirmDeleteFormProps) {
  return (
    <form
      {...props}
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
