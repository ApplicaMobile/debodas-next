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
  { href: "/mi-cuenta/cronograma", label: "Cronograma", available: true },
  { href: "/mi-cuenta/faq", label: "FAQ", available: true },
  { href: "/mi-cuenta/tema", label: "Tema del micrositio", available: true },
  { href: "/mi-cuenta/invitados", label: "Invitados / RSVP", available: true },
  { href: "/mi-cuenta/plan", label: "Plan y facturación", available: true },
];
