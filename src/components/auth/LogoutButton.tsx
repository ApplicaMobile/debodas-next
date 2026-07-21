"use client";

import { logoutAction } from "@/lib/auth/actions";
import { useFormStatus } from "react-dom";

interface LogoutButtonProps {
  className?: string;
}

function LogoutSubmitButton({ className }: LogoutButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={
        className ??
        "rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-wait disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm"
      }
    >
      <span className="sm:hidden">{pending ? "Saliendo…" : "Salir"}</span>
      <span className="hidden sm:inline">
        {pending ? "Cerrando sesión…" : "Cerrar sesión"}
      </span>
    </button>
  );
}

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <LogoutSubmitButton className={className} />
    </form>
  );
}
