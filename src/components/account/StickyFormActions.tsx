import type { ReactNode } from "react";

interface StickyFormActionsProps {
  children: ReactNode;
  alert?: ReactNode;
}

/** Barra fija inferior para formularios largos del panel. */
export function StickyFormActions({ children, alert }: StickyFormActionsProps) {
  return (
    <>
      <div className="h-20" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center justify-between gap-3 lg:pl-[calc(240px+2rem)]">
          <div className="min-w-0 flex-1">{alert}</div>
          <div className="shrink-0">{children}</div>
        </div>
      </div>
    </>
  );
}
