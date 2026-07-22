export const INVITATION_THEMES = [
  "hojas",
  "hojas-rsvp",
  "flores",
  "flores-rsvp",
  "manantial",
  "manantial-rsvp",
  "marfil",
  "marfil-rsvp",
] as const;

export type InvitationThemeSlug = (typeof INVITATION_THEMES)[number];

export const INVITATION_OUTFITS = ["formal", "informal", "sport"] as const;

export type InvitationOutfit = (typeof INVITATION_OUTFITS)[number];

export interface InvitationLocation {
  address: string;
  lat: string;
  lng: string;
}

export interface DigitalInvitation {
  id: string;
  name: string;
  title: string;
  description: string;
  theme: InvitationThemeSlug;
  /** ISO datetime local: YYYY-MM-DDTHH:mm */
  datetime: string;
  outfit: InvitationOutfit;
  locationName: string;
  location: InvitationLocation;
  isVisibleInMicrosite: boolean;
  createdAt: string;
}

export interface InvitationThemeOption {
  slug: InvitationThemeSlug;
  label: string;
  isRsvp: boolean;
  previewSrc: string;
  backgroundSrc: string;
  stackNames: boolean;
}

export const OUTFIT_LABELS: Record<InvitationOutfit, string> = {
  formal: "Formal",
  informal: "Informal",
  sport: "Elegante Sport",
};

export const MAX_INVITATIONS = 8;
