"use client";

import { useEffect, useRef } from "react";

interface FormAlertProps {
  error?: string;
  success?: string;
}

export function FormAlert({ error, success }: FormAlertProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!error && !success) return;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [error, success]);

  if (!error && !success) {
    return null;
  }

  if (error) {
    return (
      <p
        ref={ref}
        role="alert"
        className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
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
      className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800"
    >
      {success}
    </p>
  );
}
