export type AccountSectionGroup = "inicio" | "boda" | "invitados" | "regalos" | "cuenta";

export interface AccountSection {
  href: string;
  label: string;
  available: boolean;
  exact?: boolean;
  /** Grupo de la navegación del panel. */
  group: AccountSectionGroup;
  /** Ayuda corta (una línea) que se muestra en el panel y en el inicio. */
  description: string;
  /** false = no se muestra como tarjeta en el resumen de /mi-cuenta. */
  inSummary?: boolean;
}

export const accountSectionGroups: { id: AccountSectionGroup; title: string }[] = [
  { id: "inicio", title: "General" },
  { id: "boda", title: "Tu boda y tu sitio" },
  { id: "invitados", title: "Invitados" },
  { id: "regalos", title: "Regalos" },
  { id: "cuenta", title: "Cuenta" },
];

export const accountSections: AccountSection[] = [
  {
    href: "/mi-cuenta",
    label: "Inicio",
    available: true,
    exact: true,
    group: "inicio",
    description: "Tu resumen y los próximos pasos",
  },
  {
    href: "/mi-cuenta/boda",
    label: "Datos de la boda",
    available: true,
    group: "boda",
    description: "Nombres, fecha, lugar, historia y contraseña",
  },
  {
    href: "/mi-cuenta/tema",
    label: "Tema del sitio",
    available: true,
    group: "boda",
    description: "Elegí o cambiá el diseño de tu micrositio",
  },
  {
    href: "/mi-cuenta/banner",
    label: "Portada y galería",
    available: true,
    group: "boda",
    description: "Foto principal y álbum de fotos",
  },
  {
    href: "/mi-cuenta/cronograma",
    label: "Cronograma",
    available: true,
    group: "boda",
    description: "Los horarios del gran día",
  },
  {
    href: "/mi-cuenta/dress-code",
    label: "Dress code",
    available: true,
    group: "boda",
    description: "Cómo pedís que vayan vestidos",
  },
  {
    href: "/mi-cuenta/faq",
    label: "Preguntas frecuentes",
    available: true,
    group: "boda",
    description: "Respuestas a las dudas de tus invitados",
  },
  {
    href: "/mi-cuenta/invitar",
    label: "Compartir e invitar",
    available: true,
    group: "invitados",
    description: "Link del sitio, WhatsApp e invitaciones",
  },
  {
    href: "/mi-cuenta/invitados",
    label: "Invitados y RSVP",
    available: true,
    group: "invitados",
    description: "Quién confirmó, quién falta y menús",
  },
  {
    href: "/mi-cuenta/regalos",
    label: "Lista de regalos",
    available: true,
    group: "regalos",
    description: "Los regalos que pueden elegir tus invitados",
  },
  {
    href: "/mi-cuenta/regalos-recibidos",
    label: "Regalos recibidos",
    available: true,
    group: "regalos",
    description: "Lo que te regalaron y lo que falta confirmar",
  },
  {
    href: "/mi-cuenta/pagos",
    label: "Métodos de pago",
    available: true,
    group: "regalos",
    description: "Cómo te pagan los regalos: transferencia o MercadoPago",
  },
  {
    href: "/mi-cuenta/notificaciones",
    label: "Notificaciones",
    available: true,
    group: "cuenta",
    description: "Avisos de regalos, confirmaciones y pagos",
  },
  {
    href: "/mi-cuenta/plan",
    label: "Plan y facturación",
    available: true,
    group: "cuenta",
    description: "Tu plan, límites y opciones del sitio",
  },
  {
    href: "/mi-cuenta/cuenta",
    label: "Mi cuenta",
    available: true,
    group: "cuenta",
    description: "Tu email de acceso y la baja de la cuenta",
    inSummary: false,
  },
];

/** Secciones ordenadas por grupo, tal como se muestran en la navegación. */
export const accountSectionsByGroup = accountSectionGroups.map((group) => ({
  ...group,
  sections: accountSections.filter((section) => section.group === group.id),
}));

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
