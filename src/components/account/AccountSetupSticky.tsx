"use client";

import Link from "next/link";

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
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:hidden"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-stone-600">
          <span className="font-semibold text-stone-800">Siguiente paso:</span>
          <br />
          {label}
        </p>
        <Link
          href={href}
          className="shrink-0 rounded-full bg-[#06263a] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Continuar →
        </Link>
      </div>
    </div>
  );
}
