import type { ThemePlan } from "@/lib/themes/types";
import { normalizePlan } from "@/lib/plans/features";

export type MicrositeFontSlug =
  | "tema-default"
  | "cormorant-infant"
  | "libre-baskerville"
  | "simonetta"
  | "josefin-slab";

export interface MicrositeFontOption {
  slug: MicrositeFontSlug;
  label: string;
  plan: ThemePlan;
  /** Si true, hereda tipografías del tema visual. */
  inherit?: boolean;
  family?: string;
  fallback?: string;
  googleFontsHref?: string;
  previewText?: string;
}

const planRank: Record<string, number> = {
  free: 0,
  basico: 1,
  premium: 2,
};

export const micrositeFonts: Record<MicrositeFontSlug, MicrositeFontOption> = {
  "tema-default": {
    slug: "tema-default",
    label: "Por defecto del tema",
    plan: "free",
    inherit: true,
    previewText: "Aa — tipografía del diseño",
  },
  "cormorant-infant": {
    slug: "cormorant-infant",
    label: "Cormorant Infant",
    plan: "basico",
    family: "Cormorant Infant",
    fallback: "serif",
    googleFontsHref:
      "https://fonts.googleapis.com/css2?family=Cormorant+Infant:ital,wght@0,400;0,600;1,400&display=swap",
    previewText: "Aa Bb Cc — elegante y clásica",
  },
  "libre-baskerville": {
    slug: "libre-baskerville",
    label: "Libre Baskerville",
    plan: "basico",
    family: "Libre Baskerville",
    fallback: "serif",
    googleFontsHref:
      "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap",
    previewText: "Aa Bb Cc — lectura editorial",
  },
  simonetta: {
    slug: "simonetta",
    label: "Simonetta",
    plan: "premium",
    family: "Simonetta",
    fallback: "serif",
    googleFontsHref:
      "https://fonts.googleapis.com/css2?family=Simonetta:ital,wght@0,400;0,900;1,400&display=swap",
    previewText: "Aa Bb Cc — con carácter",
  },
  "josefin-slab": {
    slug: "josefin-slab",
    label: "Josefin Slab",
    plan: "premium",
    family: "Josefin Slab",
    fallback: "serif",
    googleFontsHref:
      "https://fonts.googleapis.com/css2?family=Josefin+Slab:wght@400;600;700&display=swap",
    previewText: "Aa Bb Cc — moderna y limpia",
  },
};

export const fontList = Object.values(micrositeFonts);

export function isMicrositeFontSlug(value: string): value is MicrositeFontSlug {
  return value in micrositeFonts;
}

export function sanitizeMicrositeFont(value: unknown): MicrositeFontSlug {
  const raw = String(value ?? "").trim();
  if (isMicrositeFontSlug(raw)) return raw;
  return "tema-default";
}

export function canUseFont(
  userPlan: string | null | undefined,
  fontPlan: ThemePlan,
): boolean {
  const userRank = planRank[normalizePlan(userPlan)] ?? 0;
  const required = planRank[fontPlan] ?? 0;
  return userRank >= required;
}

export function getEffectiveFontSlug(
  userPlan: string | null | undefined,
  saved: unknown,
): MicrositeFontSlug {
  const slug = sanitizeMicrositeFont(saved);
  const font = micrositeFonts[slug];
  if (!canUseFont(userPlan, font.plan)) {
    return "tema-default";
  }
  return slug;
}

export function getFontCssStack(slug: MicrositeFontSlug): string | null {
  const font = micrositeFonts[slug];
  if (!font || font.inherit || !font.family) return null;
  return `'${font.family}', ${font.fallback ?? "serif"}`;
}

export function getFontFromMisc(
  misc: Record<string, unknown> | null | undefined,
): MicrositeFontSlug {
  if (!misc) return "tema-default";
  return sanitizeMicrositeFont(misc.microsite_font ?? misc.micrositeFont);
}

export function getThemePreviewAssets(slug: string): {
  bannerImage: string;
  previewImage: string;
} {
  const MARKETING = "/assets/img/marketing";
  const bannerBySlug: Record<string, string> = {
    base: `${MARKETING}/theme-base.jpg`,
    hojas: `${MARKETING}/theme-hojas.jpg`,
    flores: `${MARKETING}/theme-flores.jpg`,
    manantial: `${MARKETING}/theme-manantial.jpg`,
    marfil: `${MARKETING}/theme-marfil.jpg`,
    "mariposas-azules": `${MARKETING}/theme-mariposas.jpg`,
    "marco-verde": `${MARKETING}/theme-marco-verde.jpg`,
    "marco-blanco": `${MARKETING}/theme-marco-blanco.jpg`,
    "marco-flores-inferiores": `${MARKETING}/theme-marco-flores.jpg`,
  };

  return {
    bannerImage: bannerBySlug[slug] ?? `${MARKETING}/theme-base.jpg`,
    previewImage: `/assets/img/themes/${slug}-home.svg`,
  };
}
