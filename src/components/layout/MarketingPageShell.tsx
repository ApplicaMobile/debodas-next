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
      <main className="min-h-screen bg-[#f7f3eb] pt-24 pb-16">{children}</main>
      <SiteFooter />
    </>
  );
}
