"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import {
  accountSections,
  getActiveAccountSection,
  isAccountSectionActive,
  type AccountSection,
} from "@/lib/account/sections";

export type AccountSidebarBadges = Partial<Record<string, number>>;

const SECTION_GROUPS: { title: string; hrefs: string[] }[] = [
  {
    title: "Inicio",
    hrefs: ["/mi-cuenta", "/mi-cuenta/notificaciones", "/mi-cuenta/boda"],
  },
  {
    title: "Invitar y regalos",
    hrefs: [
      "/mi-cuenta/invitar",
      "/mi-cuenta/invitados",
      "/mi-cuenta/regalos",
      "/mi-cuenta/regalos-recibidos",
      "/mi-cuenta/pagos",
    ],
  },
  {
    title: "Contenido del sitio",
    hrefs: [
      "/mi-cuenta/banner",
      "/mi-cuenta/cronograma",
      "/mi-cuenta/dress-code",
      "/mi-cuenta/faq",
      "/mi-cuenta/tema",
    ],
  },
  {
    title: "Cuenta",
    hrefs: ["/mi-cuenta/plan"],
  },
];

function SectionLink({
  section,
  pathname,
  badges,
  onNavigate,
}: {
  section: AccountSection;
  pathname: string;
  badges?: AccountSidebarBadges;
  onNavigate?: () => void;
}) {
  const active = isAccountSectionActive(
    pathname,
    section.href,
    section.exact,
  );
  const badge = badges?.[section.href];
  const className = active
    ? "bg-[#e6dac7]/25 font-semibold text-stone-800"
    : section.available
      ? "text-stone-700 hover:bg-stone-50"
      : "text-stone-400";

  if (!section.available) {
    return (
      <li>
        <span
          className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${className}`}
        >
          {section.label}
          <span className="text-[10px] uppercase tracking-wide">Pronto</span>
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={section.href}
        onClick={onNavigate}
        className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition ${className}`}
      >
        <span>{section.label}</span>
        {badge && badge > 0 ? (
          <span
            className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white"
            aria-label={`${badge} pendientes`}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function SectionNavList({
  pathname,
  badges,
  onNavigate,
  grouped = false,
}: {
  pathname: string;
  badges?: AccountSidebarBadges;
  onNavigate?: () => void;
  grouped?: boolean;
}) {
  if (!grouped) {
    return (
      <ul className="space-y-1">
        {accountSections.map((section) => (
          <SectionLink
            key={section.href}
            section={section}
            pathname={pathname}
            badges={badges}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    );
  }

  const byHref = new Map(accountSections.map((s) => [s.href, s]));

  return (
    <div className="space-y-5">
      {SECTION_GROUPS.map((group) => {
        const items = group.hrefs
          .map((href) => byHref.get(href))
          .filter((s): s is AccountSection => Boolean(s));
        if (items.length === 0) return null;
        return (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              {group.title}
            </p>
            <ul className="space-y-1">
              {items.map((section) => (
                <SectionLink
                  key={section.href}
                  section={section}
                  pathname={pathname}
                  badges={badges}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function AccountSidebar({
  badges,
}: {
  badges?: AccountSidebarBadges;
}) {
  const pathname = usePathname();
  const activeSection = getActiveAccountSection(pathname);
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const titleId = useId();
  const activeBadge = badges?.[activeSection.href] ?? 0;
  const totalBadges = Object.values(badges ?? {}).reduce(
    (sum: number, n) => sum + (typeof n === "number" ? n : 0),
    0,
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => setEntered(true));

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-[4.5rem] z-20 -mx-4 mb-4 border-b border-stone-200/80 bg-[#EBEBEB]/95 px-4 py-2 backdrop-blur-sm supports-[backdrop-filter]:bg-[#EBEBEB]/90 sm:top-[5.25rem] lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              Sección
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-stone-800">
              <span className="truncate">{activeSection.label}</span>
              {activeBadge > 0 ? (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {activeBadge}
                </span>
              ) : null}
            </span>
          </span>
          <span className="relative ml-3 shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
            Menú
            {totalBadges > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                {totalBadges > 9 ? "9+" : totalBadges}
              </span>
            ) : null}
          </span>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            type="button"
            aria-label="Cerrar menú"
            className={`absolute inset-0 bg-stone-900/40 transition-opacity duration-200 ${
              entered ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${
              entered ? "translate-x-0" : "-translate-x-full"
            }`}
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
            <nav className="flex-1 overflow-y-auto p-3 pb-8">
              <SectionNavList
                pathname={pathname}
                badges={badges}
                onNavigate={() => setOpen(false)}
                grouped
              />
            </nav>
          </aside>
        </div>
      ) : null}

      <nav className="hidden rounded-3xl bg-white p-4 shadow-sm lg:block">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
          Panel
        </p>
        <SectionNavList pathname={pathname} badges={badges} grouped />
      </nav>
    </>
  );
}
