import Link from "next/link";
import type { ReactNode } from "react";

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
}

export function AccountEmptyState({
  title,
  description,
  actions,
  children,
}: AccountEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center">
      <p className="font-medium text-stone-700">{title}</p>
      <p className="mt-1 text-sm text-stone-500">{description}</p>
      {actions && actions.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {actions.map((action) =>
            action.href ? (
              <Link
                key={`${action.label}-${action.href}`}
                href={action.href}
                className={
                  action.primary
                    ? "rounded-full bg-[#e6dac7] px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-[#ddd0bb]"
                    : "rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                }
              >
                {action.label}
              </Link>
            ) : null,
          )}
        </div>
      ) : null}
      {children}
    </div>
  );
}
