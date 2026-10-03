"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/ToastProvider";

interface FormAlertProps {
  error?: string;
  success?: string;
}

export function FormAlert({ error, success }: FormAlertProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { pushToast } = useToast();
  const lastRef = useRef<string>("");

  useEffect(() => {
    if (!error && !success) return;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const key = error ? `e:${error}` : `s:${success}`;
    if (key === lastRef.current) return;
    lastRef.current = key;

    if (error) {
      pushToast(error, "error");
    } else if (success) {
      pushToast(success, "success");
    }
  }, [error, success, pushToast]);

  if (!error && !success) {
    return null;
  }

  if (error) {
    return (
      <p
        ref={ref}
        role="alert"
        className="rounded-md border border-status-error-border bg-status-error-bg px-4 py-3 type-body-sm font-medium text-status-error-fg"
      >
        {error}
      </p>
    );
  }

  return (
    <p
      ref={ref}
      role="status"
      aria-live="polite"
      className="rounded-md border border-status-success-border bg-status-success-bg px-4 py-3 type-body-sm font-medium text-status-success-fg"
    >
      {success}
    </p>
  );
}
