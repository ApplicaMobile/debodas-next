import type { MessageKey } from "@/i18n/dictionary";

export interface MicrositeNavItem {
  href: string;
  label: string;
  primary?: boolean;
}

export interface MicrositeNavFlags {
  showGallery?: boolean;
  showSchedule?: boolean;
  showLocation?: boolean;
  showFaq?: boolean;
  showDressCode?: boolean;
  showRsvp?: boolean;
  showCanva?: boolean;
  showMusic?: boolean;
}

/**
 * Secciones del micrositio en orden. Lo usan la navegación del banner y la barra fija
 * (MicrositeSectionNav) para que ambas apunten siempre a los mismos anchors.
 */
export function buildMicrositeNavItems(
  t: (key: MessageKey) => string,
  {
    showGallery = false,
    showSchedule = true,
    showLocation = false,
    showFaq = true,
    showDressCode = false,
    showRsvp = true,
    showCanva = false,
    showMusic = false,
  }: MicrositeNavFlags,
): MicrositeNavItem[] {
  return [
    { href: "#regalos", label: t("microsite.gifts") },
    ...(showGallery ? [{ href: "#album", label: t("microsite.photos") }] : []),
    ...(showSchedule
      ? [{ href: "#cronograma", label: t("microsite.schedule") }]
      : []),
    ...(showLocation
      ? [{ href: "#ubicacion", label: t("microsite.location") }]
      : []),
    ...(showCanva
      ? [{ href: "#invitacion-canva", label: t("microsite.invite") }]
      : []),
    ...(showDressCode
      ? [{ href: "#dress-code", label: t("microsite.attire") }]
      : []),
    ...(showFaq ? [{ href: "#faq", label: t("microsite.faq") }] : []),
    ...(showMusic ? [{ href: "#musica", label: t("microsite.music") }] : []),
    ...(showRsvp
      ? [{ href: "#rsvp", label: t("microsite.rsvp"), primary: true }]
      : []),
  ];
}
