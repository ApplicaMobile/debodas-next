export interface AccountSection {
  href: string;
  label: string;
  available: boolean;
  exact?: boolean;
}

export const accountSections: AccountSection[] = [
  { href: "/mi-cuenta", label: "Resumen", available: true, exact: true },
  { href: "/mi-cuenta/boda", label: "Datos de la boda", available: true },
  { href: "/mi-cuenta/banner", label: "Banner y galería", available: true },
  { href: "/mi-cuenta/regalos", label: "Lista de regalos", available: true },
  {
    href: "/mi-cuenta/regalos-recibidos",
    label: "Regalos recibidos",
    available: true,
  },
  { href: "/mi-cuenta/pagos", label: "Métodos de pago", available: true },
  { href: "/mi-cuenta/cronograma", label: "Cronograma", available: true },
  { href: "/mi-cuenta/dress-code", label: "Dress code", available: true },
  { href: "/mi-cuenta/faq", label: "FAQ", available: true },
  { href: "/mi-cuenta/tema", label: "Tema del micrositio", available: true },
  { href: "/mi-cuenta/invitados", label: "Invitados / RSVP", available: true },
  { href: "/mi-cuenta/plan", label: "Plan y facturación", available: true },
];

export function isAccountSectionActive(
  pathname: string,
  href: string,
  exact?: boolean,
) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveAccountSection(pathname: string): AccountSection {
  const exactMatch = accountSections.find(
    (section) => section.exact && pathname === section.href,
  );
  if (exactMatch) {
    return exactMatch;
  }

  const matches = accountSections
    .filter(
      (section) =>
        !section.exact &&
        (pathname === section.href || pathname.startsWith(`${section.href}/`)),
    )
    .sort((a, b) => b.href.length - a.href.length);

  return matches[0] ?? accountSections[0];
}
