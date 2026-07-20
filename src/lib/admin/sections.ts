export interface AdminSection {
  href: string;
  label: string;
  exact?: boolean;
}

export const adminSections: AdminSection[] = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/estadisticas", label: "Estadísticas" },
  { href: "/admin/bodas", label: "Bodas" },
  { href: "/admin/calificaciones", label: "Calificaciones" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/pagos", label: "Pagos" },
  { href: "/admin/emails", label: "Emails" },
];

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
