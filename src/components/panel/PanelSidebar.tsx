"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { AccountNavIcon } from "@/components/account/AccountNavIcon";
import { IconMenu, IconX } from "@/components/ui";
import { cn } from "@/lib/cn";

/**
 * Navegación lateral compartida por los paneles (/mi-cuenta y /admin):
 * menú agrupado con íconos en desktop, barra con la sección actual + drawer
 * accesible en mobile (foco atrapado, Escape, bloqueo de scroll) y migas de pan.
 */

export interface PanelNavSection {
  href: string;
  label: string;
  /** Ayuda corta (una línea) que se muestra bajo la sección activa. */
  description: string;
  /** false = se muestra deshabilitada con "Pronto". */
  available?: boolean;
  exact?: boolean;
  group: string;
}

export interface PanelNavGroup {
  id: string;
  title: string;
  sections: PanelNavSection[];
}

export type PanelSidebarBadges = Partial<Record<string, number>>;

export function isPanelSectionActive(
  pathname: string,
  href: string,
  exact?: boolean,
) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActivePanelSection(
  groups: PanelNavGroup[],
  pathname: string,
): PanelNavSection {
  const sections = groups.flatMap((group) => group.sections);
  const exactMatch = sections.find(
    (section) => section.exact && pathname === section.href,
  );
  if (exactMatch) {
    return exactMatch;
  }

  const matches = sections
    .filter(
      (section) =>
        !section.exact &&
        (pathname === section.href || pathname.startsWith(`${section.href}/`)),
    )
    .sort((a, b) => b.href.length - a.href.length);

  return matches[0] ?? sections[0];
}

export function PanelCountBadge({
  count,
  label,
}: {
  count: number;
  label: string;
}) {
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
  section: PanelNavSection;
  pathname: string;
  badges?: PanelSidebarBadges;
  onNavigate?: () => void;
}) {
  const active = isPanelSectionActive(pathname, section.href, section.exact);
  const badge = badges?.[section.href];

  if (section.available === false) {
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
          <PanelCountBadge count={badge} label={`${badge} pendientes`} />
        ) : null}
      </Link>
    </li>
  );
}

function SectionNavList({
  groups,
  untitledGroupId,
  pathname,
  badges,
  onNavigate,
}: {
  groups: PanelNavGroup[];
  untitledGroupId?: string;
  pathname: string;
  badges?: PanelSidebarBadges;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-4">
      {groups.map((group) => {
        if (group.sections.length === 0) return null;
        const headingId = `nav-grupo-${group.id}`;
        const titled = group.id !== untitledGroupId;
        return (
          <div key={group.id}>
            {titled ? (
              <p
                id={headingId}
                className="px-3 pb-1.5 type-overline text-text-tertiary"
              >
                {group.title}
              </p>
            ) : null}
            <ul
              className="space-y-0.5"
              aria-labelledby={titled ? headingId : undefined}
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

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface PanelSidebarProps {
  groups: PanelNavGroup[];
  /** Grupo que se muestra sin título (p. ej. el inicio). */
  untitledGroupId?: string;
  /** aria-label de la navegación ("Secciones de mi cuenta"). */
  navLabel: string;
  /** Título visible del drawer en mobile ("Menú de tu cuenta"). */
  drawerTitle: string;
  badges?: PanelSidebarBadges;
  /** Bloque sobre el menú (p. ej. resumen del micrositio). Recibe el cierre del drawer. */
  renderHeader?: (onNavigate?: () => void) => ReactNode;
  email?: string | null;
}

export function PanelSidebar({
  groups,
  untitledGroupId,
  navLabel,
  drawerTitle,
  badges,
  renderHeader,
  email,
}: PanelSidebarProps) {
  const pathname = usePathname();
  const activeSection = getActivePanelSection(groups, pathname);
  const activeGroup = groups.find((group) => group.id === activeSection.group);
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
      <div className="sticky top-16 z-20 mb-5 border-b border-border-subtle bg-bg-canvas/95 py-2 backdrop-blur-sm lg:hidden">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-border-default bg-surface-default px-3 py-2.5 text-left shadow-elevation-1"
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
                {activeGroup && activeGroup.id !== untitledGroupId
                  ? activeGroup.title
                  : "Estás en"}
              </span>
              <span className="flex items-center gap-2 type-label text-text-primary">
                <span className="truncate">{activeSection.label}</span>
                {activeBadge > 0 ? (
                  <PanelCountBadge
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
                <PanelCountBadge
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
                {drawerTitle}
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
              aria-label={navLabel}
              className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-3 pb-8"
            >
              {renderHeader ? renderHeader(close) : null}
              <SectionNavList
                groups={groups}
                untitledGroupId={untitledGroupId}
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
      <nav aria-label={navLabel} className="hidden lg:block">
        <div className="space-y-4 rounded-md bg-surface-default p-3 shadow-elevation-1">
          {renderHeader ? renderHeader() : null}
          <SectionNavList
            groups={groups}
            untitledGroupId={untitledGroupId}
            pathname={pathname}
            badges={badges}
          />
        </div>
      </nav>
    </>
  );
}

/**
 * Migas de pan (desktop): panel › grupo › sección. Se oculta en el inicio.
 * En subpáginas (p. ej. un detalle) la sección es un enlace para volver al listado.
 */
export function PanelBreadcrumb({
  groups,
  rootHref,
  rootLabel,
  untitledGroupId,
}: {
  groups: PanelNavGroup[];
  rootHref: string;
  rootLabel: string;
  untitledGroupId?: string;
}) {
  const pathname = usePathname();
  const section = getActivePanelSection(groups, pathname);
  if (section.exact) return null;
  const group = groups.find(
    (g) => g.id === section.group && g.id !== untitledGroupId,
  );
  const isSubpage = pathname !== section.href;

  return (
    <nav aria-label="Ubicación" className="mb-4 hidden lg:block">
      <ol className="flex flex-wrap items-center gap-1.5 type-body-sm text-text-tertiary">
        <li>
          <Link
            href={rootHref}
            className="focus-ring rounded-sm hover:text-text-primary hover:underline"
          >
            {rootLabel}
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
          {isSubpage ? (
            <Link
              href={section.href}
              className="focus-ring rounded-sm hover:text-text-primary hover:underline"
            >
              {section.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-semibold text-text-primary">
              {section.label}
            </span>
          )}
        </li>
        {isSubpage ? (
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true">›</span>
            <span aria-current="page" className="font-semibold text-text-primary">
              Detalle
            </span>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
