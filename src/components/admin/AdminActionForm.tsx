"use client";

import type { ReactNode } from "react";

interface AdminActionFormProps {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  className?: string;
  confirmMessage?: string;
}

export function AdminActionForm({
  action,
  children,
  className,
  confirmMessage,
}: AdminActionFormProps) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
