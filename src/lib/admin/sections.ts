export type AdminSectionGroup =
  | "inicio"
  | "sistema"
  | "clientes"
  | "pagos"
  | "operacion";

export interface AdminSection {
  href: string;
  label: string;
  exact?: boolean;
  /** Grupo de la navegación del panel. */
  group: AdminSectionGroup;
  /** Ayuda corta (una línea) que se muestra en el menú. */
  description: string;
}

export const adminSectionGroups: { id: AdminSectionGroup; title: string }[] = [
  { id: "inicio", title: "General" },
  { id: "sistema", title: "Sistema" },
  { id: "clientes", title: "Bodas y clientes" },
  { id: "pagos", title: "Pagos" },
  { id: "operacion", title: "Operación" },
];

export const adminSections: AdminSection[] = [
  {
    href: "/admin",
    label: "Resumen",
    exact: true,
    group: "inicio",
    description: "Indicadores y alertas de la plataforma",
  },
  {
    href: "/admin/estado",
    label: "Estado del sistema",
    group: "sistema",
    description: "Base de datos, SMTP, crons, storage y MercadoPago",
  },
  {
    href: "/admin/estadisticas",
    label: "Estadísticas",
    group: "sistema",
    description: "Altas, actividad, fuentes y planes",
  },
  {
    href: "/admin/bodas",
    label: "Bodas",
    group: "clientes",
    description: "Micrositios, dueños, planes y actividad",
  },
  {
    href: "/admin/calificaciones",
    label: "Calificaciones",
    group: "clientes",
    description: "Moderá las reseñas que se muestran en la home",
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    group: "clientes",
    description: "Cuentas y roles de acceso",
  },
  {
    href: "/admin/pagos",
    label: "Pagos",
    group: "pagos",
    description: "Pagos de planes y regalos por confirmar",
  },
  {
    href: "/admin/mercadopago",
    label: "MercadoPago",
    group: "pagos",
    description: "Credenciales de la plataforma y webhook",
  },
  {
    href: "/admin/emails",
    label: "Emails",
    group: "operacion",
    description: "Cola, historial y reintentos de envíos",
  },
  {
    href: "/admin/auditoria",
    label: "Auditoría",
    group: "operacion",
    description: "Registro de acciones administrativas",
  },
  {
    href: "/admin/migracion",
    label: "Migración WP",
    group: "operacion",
    description: "Importar bodas desde WordPress",
  },
];

/** Secciones ordenadas por grupo, tal como se muestran en la navegación. */
export const adminSectionsByGroup = adminSectionGroups.map((group) => ({
  ...group,
  sections: adminSections.filter((section) => section.group === group.id),
}));

export function isAdminSectionActive(
  pathname: string,
  href: string,
  exact?: boolean,
) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveAdminSection(pathname: string): AdminSection {
  const exactMatch = adminSections.find(
    (section) => section.exact && pathname === section.href,
  );
  if (exactMatch) {
    return exactMatch;
  }

  const matches = adminSections
    .filter(
      (section) =>
        !section.exact &&
        (pathname === section.href || pathname.startsWith(`${section.href}/`)),
    )
    .sort((a, b) => b.href.length - a.href.length);

  return matches[0] ?? adminSections[0];
}
