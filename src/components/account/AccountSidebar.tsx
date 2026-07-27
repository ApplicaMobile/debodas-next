"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import {
  accountSections,
  getActiveAccountSection,
  isAccountSectionActive,
} from "@/lib/account/sections";

function SectionNavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
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
              onClick={onNavigate}
              className={`block rounded-xl px-3 py-2.5 text-sm transition ${className}`}
            >
              {section.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AccountSidebar() {
  const pathname = usePathname();
  const activeSection = getActiveAccountSection(pathname);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      {/* Mobile: botón + drawer */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              Sección
            </span>
            <span className="mt-0.5 block text-sm font-semibold text-stone-800">
              {activeSection.label}
            </span>
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
            Menú
          </span>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-stone-900/40"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-4">
              <div>
                <p
                  id={titleId}
                  className="text-xs font-semibold uppercase tracking-wide text-stone-400"
                >
                  Panel
                </p>
                <p className="mt-0.5 text-sm font-semibold text-stone-800">
                  {activeSection.label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
              >
                Cerrar
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              <SectionNavList
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            </nav>
          </aside>
        </div>
      ) : null}

      {/* Desktop */}
      <nav className="hidden rounded-3xl bg-white p-4 shadow-sm lg:block">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
          Panel
        </p>
        <SectionNavList pathname={pathname} />
      </nav>
    </>
  );
}
