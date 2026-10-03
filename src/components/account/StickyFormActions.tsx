import type { ReactNode } from "react";
import { AccountFormActions } from "@/components/account/AccountPage";

interface StickyFormActionsProps {
  children: ReactNode;
  alert?: ReactNode;
}

/** Alias de AccountFormActions (pie del formulario, fijo abajo en mobile). */
export function StickyFormActions({ children, alert }: StickyFormActionsProps) {
  return <AccountFormActions alert={alert}>{children}</AccountFormActions>;
}
