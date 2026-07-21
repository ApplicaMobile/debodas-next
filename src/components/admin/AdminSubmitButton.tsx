"use client";

import { useFormStatus } from "react-dom";

interface AdminSubmitButtonProps {
  idleLabel: string;
  pendingLabel?: string;
  className?: string;
}

export function AdminSubmitButton({
  idleLabel,
  pendingLabel = "Guardando…",
  className,
}: AdminSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`${className ?? ""} disabled:cursor-wait disabled:opacity-60`}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
