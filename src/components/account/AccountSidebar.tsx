"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  accountSections,
  getActiveAccountSection,
  isAccountSectionActive,
} from "@/lib/account/sections";

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeSection = getActiveAccountSection(pathname);

  return (
    <>
      <div className="mb-4 lg:hidden">
        <label
          htmlFor="account-section-nav"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-400"
        >
          Sección
        </label>
        <select
          id="account-section-nav"
          value={activeSection.href}
          onChange={(event) => {
            router.push(event.target.value);
          }}
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-medium text-stone-800 shadow-sm focus:border-[#e6dac7] focus:outline-none focus:ring-2 focus:ring-[#e6dac7]/20"
        >
          {accountSections.map((section) => (
            <option
              key={section.href}
              value={section.href}
              disabled={!section.available}
            >
              {section.available ? section.label : `${section.label} (pronto)`}
            </option>
          ))}
        </select>
      </div>

      <nav className="hidden rounded-3xl bg-white p-4 shadow-sm lg:block">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
          Panel
        </p>
        <ul className="space-y-1">
          {accountSections.map((section) => {
            const active = isAccountSectionActive(
              pathname,
              section.href,
              section.exact,
            );
            const className = active
              ? "bg-[#e6dac7]/25 font-semibold text-stone-800"
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
    </>
  );
}
