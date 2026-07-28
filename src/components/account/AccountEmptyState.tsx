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
  icon?: ReactNode;
}

export function AccountEmptyState({
  title,
  description,
  actions,
  children,
  icon,
}: AccountEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-gradient-to-b from-stone-50 to-white px-4 py-10 text-center sm:px-8">
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e6dac7]/50 text-lg text-stone-700"
        aria-hidden
      >
        {icon ?? "·"}
      </div>
      <p className="mt-4 font-semibold text-stone-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">
        {description}
      </p>
      {actions && actions.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actions.map((action) =>
            action.href ? (
              <Link
                key={`${action.label}-${action.href}`}
                href={action.href}
                className={
                  action.primary
                    ? "rounded-full bg-[#06263a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3550]"
                    : "rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
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
