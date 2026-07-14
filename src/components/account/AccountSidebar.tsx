"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { accountSections } from "@/lib/account/sections";

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav className="rounded-3xl bg-white p-4 shadow-sm">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
        Panel
      </p>
      <ul className="space-y-1">
        {accountSections.map((section) => {
          const active = isActive(pathname, section.href, section.exact);
          const className = active
            ? "bg-[#556B2F]/10 font-semibold text-[#465A27]"
            : section.available
              ? "text-stone-700 hover:bg-stone-50"
              : "text-stone-400";

          if (!section.available) {
            return (
              <li key={section.href}>
                <span
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${className}`}
                >
                  {section.label}
                  <span className="text-[10px] uppercase tracking-wide">
                    Pronto
                  </span>
                </span>
              </li>
            );
          }

          return (
            <li key={section.href}>
              <Link
                href={section.href}
                className={`block rounded-xl px-3 py-2.5 text-sm transition ${className}`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
