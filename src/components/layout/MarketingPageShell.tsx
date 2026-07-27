import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

interface MarketingPageShellProps {
  children: ReactNode;
}

export function MarketingPageShell({ children }: MarketingPageShellProps) {
  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen overflow-hidden bg-[#f7f3eb] pt-24 pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(230,218,199,0.65),transparent_40%),radial-gradient(circle_at_90%_30%,rgba(6,38,58,0.05),transparent_35%)]" />
        <div className="relative">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
