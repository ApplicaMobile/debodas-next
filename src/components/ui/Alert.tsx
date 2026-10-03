import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconAlert, IconCheck, IconClock, IconInfo } from "./icons";

export type AlertTone = "exito" | "pendiente" | "error" | "info";

export interface AlertProps {
  tone: AlertTone;
  title: ReactNode;
  children?: ReactNode;
  /** Acción (p. ej. "Reintentar pago"). */
  action?: ReactNode;
  className?: string;
}

const styles: Record<AlertTone, string> = {
  exito: "border-status-success-border bg-status-success-bg",
  pendiente: "border-status-warning-border bg-status-warning-bg",
  error: "border-status-error-border bg-status-error-bg",
  info: "border-status-info-border bg-status-info-bg",
};
const fg: Record<AlertTone, string> = {
  exito: "text-status-success-fg",
  pendiente: "text-status-warning-fg",
  error: "text-status-error-fg",
  info: "text-status-info-fg",
};
const icons: Record<AlertTone, ReactNode> = {
  exito: <IconCheck size={20} />,
  pendiente: <IconClock size={20} />,
  error: <IconAlert size={20} />,
  info: <IconInfo size={20} />,
};

/** Aviso en línea. error → role="alert" (interrumpe); el resto → role="status". */
export function Alert({ tone, title, children, action, className }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex flex-col gap-4 rounded-md border-l-4 p-4 sm:flex-row sm:items-start sm:p-6", styles[tone], className)}
    >
      <span className={cn("mt-[3px] shrink-0", fg[tone])} aria-hidden="true">
        {icons[tone]}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <p className={cn("type-label", fg[tone])}>{title}</p>
        {children ? <div className="type-body-sm text-text-primary">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
