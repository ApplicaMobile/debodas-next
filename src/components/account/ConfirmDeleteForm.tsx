"use client";

import type { FormHTMLAttributes, ReactNode } from "react";
import { useToast } from "@/components/ui/ToastProvider";

interface ConfirmDeleteFormProps
  extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "action"> {
  action: (formData: FormData) => void | Promise<void>;
  message?: string;
  successMessage?: string;
  children: ReactNode;
}

export function ConfirmDeleteForm({
  action,
  message = "¿Seguro que querés eliminar este elemento?",
  successMessage = "Eliminado.",
  children,
  ...props
}: ConfirmDeleteFormProps) {
  const { pushToast } = useToast();

  return (
    <form
      {...props}
      action={async (formData) => {
        try {
          await action(formData);
          pushToast(successMessage, "success");
        } catch {
          pushToast("No se pudo eliminar.", "error");
        }
      }}
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
