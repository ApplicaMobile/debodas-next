"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  accountSectionGroups,
  accountSectionsByGroup,
  getActiveAccountSection,
  isAccountSectionActive,
  type AccountSection,
} from "@/lib/account/sections";
import { AccountNavIcon } from "@/components/account/AccountNavIcon";
import {
  IconExternalLink,
  IconMenu,
  IconX,
  PlanBadge,
  type PlanId,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export type AccountSidebarBadges = Partial<Record<string, number>>;

export interface AccountSidebarBoda {
  title: string;
  slug: string;
  plan: PlanId;
}

function CountBadge({ count, label }: { count: number; label: string }) {
  return (
    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-status-warning-fg px-1.5 type-caption font-bold text-text-inverse">
      <span aria-hidden="true">{count > 9 ? "9+" : count}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

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
  const active = isAccountSectionActive(pathname, section.href, section.exact);
  const badge = badges?.[section.href];

  if (!section.available) {
    return (
      <li>
        <span className="flex items-center justify-between gap-2 rounded-md px-3 py-2.5 type-body-sm text-text-disabled">
          <span className="flex min-w-0 items-center gap-3">
            <AccountNavIcon href={section.href} className="h-5 w-5 shrink-0" />
            <span className="truncate">{section.label}</span>
          </span>
          <span className="type-caption uppercase">Pronto</span>
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={section.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "focus-ring group relative flex items-start gap-3 rounded-md px-3 py-2 transition-colors motion-reduce:transition-none",
          active
            ? "bg-surface-brand text-text-on-brand"
            : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
        )}
      >
        {active ? (
          <span
            aria-hidden="true"
            className="absolute inset-y-2 left-0 w-1 rounded-full bg-action-primary-bg"
          />
        ) : null}
        <AccountNavIcon
          href={section.href}
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0",
            active ? "text-text-primary" : "text-text-accent",
          )}
        />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block type-body-sm",
              active ? "font-semibold text-text-primary" : "font-medium",
            )}
          >
            {section.label}
          </span>
          {active ? (
            <span className="mt-0.5 block type-caption text-text-secondary">
              {section.description}
            </span>
          ) : null}
        </span>
        {badge && badge > 0 ? (
          <CountBadge count={badge} label={`${badge} pendientes`} />
        ) : null}
      </Link>
    </li>
  );
}

function SectionNavList({
  pathname,
  badges,
  onNavigate,
}: {
  pathname: string;
  badges?: AccountSidebarBadges;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-4">
      {accountSectionsByGroup.map((group) => {
        if (group.sections.length === 0) return null;
        const headingId = `nav-grupo-${group.id}`;
        return (
          <div key={group.id}>
            {group.id !== "inicio" ? (
              <p
                id={headingId}
                className="px-3 pb-1.5 type-overline text-text-tertiary"
              >
                {group.title}
              </p>
            ) : null}
            <ul
              className="space-y-0.5"
              aria-labelledby={group.id !== "inicio" ? headingId : undefined}
            >
              {group.sections.map((section) => (
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

function BodaSummary({
  boda,
  onNavigate,
}: {
  boda: AccountSidebarBoda;
  onNavigate?: () => void;
}) {
  return (
    <div className="rounded-md bg-surface-muted p-3">
      <p className="type-caption text-text-tertiary">Tu micrositio</p>
      <div className="mt-1 flex items-start justify-between gap-2">
        <p className="min-w-0 break-words type-label text-text-primary">
          {boda.title}
        </p>
        <PlanBadge plan={boda.plan} className="shrink-0" />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        <a
          href={`/bodas/${boda.slug}`}
          target="_blank"
          rel="noopener"
          className="focus-ring inline-flex items-center gap-1 rounded-sm type-body-sm font-semibold text-text-link underline-offset-2 hover:underline"
        >
          Ver mi sitio
          <IconExternalLink size={14} />
          <span className="sr-only"> (se abre en otra pestaña)</span>
        </a>
        <Link
          href="/mi-cuenta/invitar"
          onClick={onNavigate}
          className="focus-ring rounded-sm type-body-sm font-semibold text-text-accent underline-offset-2 hover:underline"
        >
          Compartir e invitar
        </Link>
      </div>
    </div>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AccountSidebar({
  badges,
  boda,
  email,
}: {
  badges?: AccountSidebarBadges;
  boda?: AccountSidebarBoda | null;
  email?: string | null;
}) {
  const pathname = usePathname();
  const activeSection = getActiveAccountSection(pathname);
  const activeGroup = accountSectionGroups.find(
    (group) => group.id === activeSection.group,
  );
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const titleId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeBadge = badges?.[activeSection.href] ?? 0;
  const totalBadges = Object.values(badges ?? {}).reduce(
    (sum: number, n) => sum + (typeof n === "number" ? n : 0),
    0,
  );

  const close = useCallback(() => setOpen(false), []);

  // Cerrar el menú al navegar a otra sección.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }
  if (!open && entered) {
    setEntered(false);
  }

  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      setEntered(true);
      closeRef.current?.focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      {/* Mobile: barra fija con la sección actual y el botón del menú */}
      <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-border-subtle bg-bg-canvas/95 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:hidden">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-between gap-3 rounded-md border border-border-default bg-surface-default px-3 py-2.5 text-left shadow-elevation-1"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-brand text-text-on-brand"
            >
              <AccountNavIcon href={activeSection.href} className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block type-caption text-text-tertiary">
                {activeGroup && activeGroup.id !== "inicio"
                  ? activeGroup.title
                  : "Estás en"}
              </span>
              <span className="flex items-center gap-2 type-label text-text-primary">
                <span className="truncate">{activeSection.label}</span>
                {activeBadge > 0 ? (
                  <CountBadge
                    count={activeBadge}
                    label={`${activeBadge} pendientes`}
                  />
                ) : null}
              </span>
            </span>
          </span>
          <span className="relative flex shrink-0 items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 type-button-sm text-text-primary">
            <IconMenu size={16} />
            Menú
            {totalBadges > 0 ? (
              <span className="absolute -right-1 -top-1">
                <CountBadge
                  count={totalBadges}
                  label={`${totalBadges} avisos pendientes`}
                />
              </span>
            ) : null}
          </span>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 bg-neutral-900/40 transition-opacity duration-200 motion-reduce:transition-none",
              entered ? "opacity-100" : "opacity-0",
            )}
            onClick={close}
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "absolute inset-y-0 left-0 flex w-[min(21rem,88vw)] flex-col bg-surface-default shadow-elevation-3 transition-transform duration-200 ease-out motion-reduce:transition-none",
              entered ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
              <p id={titleId} className="type-h4 text-text-primary">
                Menú de tu cuenta
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 type-button-sm text-text-secondary hover:bg-surface-muted"
              >
                <IconX size={18} />
                Cerrar
              </button>
            </div>
            <nav
              aria-label="Secciones de mi cuenta"
              className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-3 pb-8"
            >
              {boda ? <BodaSummary boda={boda} onNavigate={close} /> : null}
              <SectionNavList
                pathname={pathname}
                badges={badges}
                onNavigate={close}
              />
              {email ? (
                <p className="truncate px-3 type-caption text-text-tertiary">
                  Sesión iniciada como {email}
                </p>
              ) : null}
            </nav>
          </div>
        </div>
      ) : null}

      {/* Desktop: barra lateral fija */}
      <nav
        aria-label="Secciones de mi cuenta"
        className="hidden lg:block"
      >
        <div className="space-y-4 rounded-md bg-surface-default p-3 shadow-elevation-1">
          {boda ? <BodaSummary boda={boda} /> : null}
          <SectionNavList pathname={pathname} badges={badges} />
        </div>
      </nav>
    </>
  );
}

/** Migas de pan (desktop): muestran el grupo y la sección actual. Se oculta en el inicio. */
export function AccountBreadcrumb() {
  const pathname = usePathname();
  const section = getActiveAccountSection(pathname);
  if (section.exact) return null;
  const group = accountSectionGroups.find((g) => g.id === section.group);

  return (
    <nav aria-label="Ubicación" className="mb-4 hidden lg:block">
      <ol className="flex flex-wrap items-center gap-1.5 type-body-sm text-text-tertiary">
        <li>
          <Link
            href="/mi-cuenta"
            className="focus-ring rounded-sm hover:text-text-primary hover:underline"
          >
            Mi cuenta
          </Link>
        </li>
        {group ? (
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true">›</span>
            <span>{group.title}</span>
          </li>
        ) : null}
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true">›</span>
          <span aria-current="page" className="font-semibold text-text-primary">
            {section.label}
          </span>
        </li>
      </ol>
    </nav>
  );
}
