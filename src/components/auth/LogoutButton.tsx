"use client";

import { logoutAction } from "@/lib/auth/actions";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          className ??
          "rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50 sm:px-4 sm:py-2 sm:text-sm"
        }
      >
        <span className="sm:hidden">Salir</span>
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>
    </form>
  );
}
