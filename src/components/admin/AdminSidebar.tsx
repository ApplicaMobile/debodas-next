"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  adminSections,
  getActiveAdminSection,
  isAdminSectionActive,
} from "@/lib/admin/sections";

export function AdminSidebar() {
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
          {adminSections.map((section) => (
            <option key={section.href} value={section.href}>
              {section.label}
            </option>
          ))}
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
            return (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-[#06263a]/10 font-semibold text-[#06263a]"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
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
