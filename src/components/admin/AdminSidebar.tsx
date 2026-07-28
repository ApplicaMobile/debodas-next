"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  adminSections,
  getActiveAdminSection,
  isAdminSectionActive,
} from "@/lib/admin/sections";

export type AdminSidebarBadges = Partial<Record<string, number>>;

export function AdminSidebar({
  badges,
}: {
  badges?: AdminSidebarBadges;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeSection = getActiveAdminSection(pathname);

  return (
    <>
      <div className="mb-4 xl:hidden">
        <label
          htmlFor="admin-section-nav"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-400"
        >
          Sección
        </label>
        <select
          id="admin-section-nav"
          value={activeSection.href}
          onChange={(event) => {
            router.push(event.target.value);
          }}
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-medium text-stone-800 shadow-sm focus:border-[#e6dac7] focus:outline-none focus:ring-2 focus:ring-[#e6dac7]/20"
        >
          {adminSections.map((section) => {
            const badge = badges?.[section.href];
            const label =
              badge && badge > 0
                ? `${section.label} (${badge})`
                : section.label;
            return (
              <option key={section.href} value={section.href}>
                {label}
              </option>
            );
          })}
        </select>
      </div>

      <nav className="hidden rounded-3xl bg-white p-4 shadow-sm xl:block">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
          Admin
        </p>
        <ul className="space-y-1">
          {adminSections.map((section) => {
            const active = isAdminSectionActive(
              pathname,
              section.href,
              section.exact,
            );
            const badge = badges?.[section.href];
            return (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-[#06263a]/10 font-semibold text-[#06263a]"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <span>{section.label}</span>
                  {badge && badge > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
