"use client";

import Link from "next/link";
import { IconArrowRight } from "@/components/ui";

interface AccountSetupStickyProps {
  label: string;
  href: string;
  ready: boolean;
}

export function AccountSetupSticky({
  label,
  href,
  ready,
}: AccountSetupStickyProps) {
  if (ready) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface-default/95 px-4 py-3 shadow-elevation-3 backdrop-blur-sm sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <p className="type-caption text-text-secondary">
          <span className="font-semibold text-text-primary">Siguiente paso:</span>
          <br />
          {label}
        </p>
        <Link
          href={href}
          className="focus-ring inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-action-primary-bg px-4 type-button-sm text-action-primary-fg hover:bg-action-primary-bg-hover"
        >
          Continuar
          <IconArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
