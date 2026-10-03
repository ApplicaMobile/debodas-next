"use client";

import { adminSectionsByGroup } from "@/lib/admin/sections";
import {
  PanelBreadcrumb,
  PanelSidebar,
  type PanelSidebarBadges,
} from "@/components/panel/PanelSidebar";

export type AdminSidebarBadges = PanelSidebarBadges;

/** Menú del panel admin: mismo patrón que /mi-cuenta (grupos con íconos y drawer en mobile). */
export function AdminSidebar({
  badges,
  email,
}: {
  badges?: AdminSidebarBadges;
  email?: string | null;
}) {
  return (
    <PanelSidebar
      groups={adminSectionsByGroup}
      untitledGroupId="inicio"
      navLabel="Secciones del panel admin"
      drawerTitle="Menú del admin"
      badges={badges}
      email={email}
    />
  );
}

/** Migas de pan del admin (desktop). Se oculta en el resumen. */
export function AdminBreadcrumb() {
  return (
    <PanelBreadcrumb
      groups={adminSectionsByGroup}
      rootHref="/admin"
      rootLabel="Panel admin"
      untitledGroupId="inicio"
    />
  );
}
