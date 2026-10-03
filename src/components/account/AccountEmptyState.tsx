import type { ComponentType, ReactNode, SVGProps } from "react";
import { Button } from "@/components/ui";

export interface AccountEmptyAction {
  label: string;
  href?: string;
  primary?: boolean;
}

interface AccountEmptyStateProps {
  title: string;
  description: string;
  actions?: AccountEmptyAction[];
  children?: ReactNode;
  /** Ilustración de la sección (de AccountIllustrations). Tiene prioridad sobre `icon`. */
  illustration?: ComponentType<SVGProps<SVGSVGElement>>;
  icon?: ReactNode;
}

/** Estado vacío común del panel: ilustración, título, explicación y siguiente acción. */
export function AccountEmptyState({
  title,
  description,
  actions,
  children,
  illustration: Illustration,
  icon,
}: AccountEmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-md border border-dashed border-border-default bg-surface-muted px-4 py-8 text-center sm:px-8 sm:py-10">
      {Illustration ? (
        <Illustration className="h-24 w-32" />
      ) : icon ? (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-default text-lg text-text-accent"
          aria-hidden
        >
          {icon}
        </div>
      ) : null}
      <p className="mt-4 type-h4 text-text-primary">{title}</p>
      <p className="mt-2 max-w-md type-body-sm text-text-secondary">{description}</p>
      {actions && actions.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {actions.map((action) =>
            action.href ? (
              <Button
                key={`${action.label}-${action.href}`}
                href={action.href}
                variant={action.primary ? "primario" : "secundario"}
              >
                {action.label}
              </Button>
            ) : null,
          )}
        </div>
      ) : null}
      {children ? <div className="mt-5 w-full">{children}</div> : null}
    </div>
  );
}
