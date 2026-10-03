"use client";

import Link from "next/link";
import { accountSectionsByGroup } from "@/lib/account/sections";
import {
  PanelBreadcrumb,
  PanelSidebar,
  type PanelSidebarBadges,
} from "@/components/panel/PanelSidebar";
import { IconExternalLink, PlanBadge, type PlanId } from "@/components/ui";

export type AccountSidebarBadges = PanelSidebarBadges;

export interface AccountSidebarBoda {
  title: string;
  slug: string;
  plan: PlanId;
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

export function AccountSidebar({
  badges,
  boda,
  email,
}: {
  badges?: AccountSidebarBadges;
  boda?: AccountSidebarBoda | null;
  email?: string | null;
}) {
  return (
    <PanelSidebar
      groups={accountSectionsByGroup}
      untitledGroupId="inicio"
      navLabel="Secciones de mi cuenta"
      drawerTitle="Menú de tu cuenta"
      badges={badges}
      email={email}
      renderHeader={
        boda
          ? (onNavigate) => <BodaSummary boda={boda} onNavigate={onNavigate} />
          : undefined
      }
    />
  );
}

/** Migas de pan (desktop): muestran el grupo y la sección actual. Se oculta en el inicio. */
export function AccountBreadcrumb() {
  return (
    <PanelBreadcrumb
      groups={accountSectionsByGroup}
      rootHref="/mi-cuenta"
      rootLabel="Mi cuenta"
      untitledGroupId="inicio"
    />
  );
}
