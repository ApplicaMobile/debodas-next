import type {
  InvitationThemeOption,
  InvitationThemeSlug,
} from "@/lib/invitations/types";
import { INVITATION_THEMES } from "@/lib/invitations/types";

const LABELS: Record<InvitationThemeSlug, string> = {
  hojas: "Hojas",
  "hojas-rsvp": "Hojas RSVP",
  flores: "Flores",
  "flores-rsvp": "Flores RSVP",
  manantial: "Manantial",
  "manantial-rsvp": "Manantial RSVP",
  marfil: "Marfil",
  "marfil-rsvp": "Marfil RSVP",
};

const STACK_NAMES = new Set<InvitationThemeSlug>([
  "hojas",
  "hojas-rsvp",
  "flores",
  "flores-rsvp",
  "manantial",
  "manantial-rsvp",
]);

export function isInvitationThemeSlug(
  value: string,
): value is InvitationThemeSlug {
  return (INVITATION_THEMES as readonly string[]).includes(value);
}

export function getInvitationThemeOptions(): InvitationThemeOption[] {
  return INVITATION_THEMES.map((slug) => ({
    slug,
    label: LABELS[slug],
    isRsvp: slug.endsWith("-rsvp"),
    previewSrc: `/assets/img/themes/${slug}-invitation-prev.png`,
    backgroundSrc: `/assets/img/themes/fondo-tarjeta-${slug}.svg`,
    stackNames: STACK_NAMES.has(slug),
  }));
}

export function getInvitationTheme(
  slug: string,
): InvitationThemeOption | null {
  if (!isInvitationThemeSlug(slug)) {
    return null;
  }
  return getInvitationThemeOptions().find((t) => t.slug === slug) ?? null;
}

export const INVITATION_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Lora&family=Great+Vibes&family=Bodoni+Moda&family=Bona+Nova:ital,wght@0,400;0,700;1,400&family=Josefin+Sans:wght@300&family=Pinyon+Script&display=swap";
