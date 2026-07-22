export type ThemePlan = "free" | "basico" | "premium";

export type ThemeBannerMode =
  | "photo-overlay"
  | "svg-hero"
  | "frame-overlay"
  | "full-background";

export interface ThemeFonts {
  heading: string;
  body: string;
  googleFontsHref?: string;
}

export interface ThemeColors {
  page: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  button: string;
  buttonText: string;
  sectionSoft: string;
  countdownBox: string;
  countdownText: string;
  bannerText: string;
}

export interface ThemeUi {
  radiusCard: string;
  radiusButton: string;
  cardBg: string;
  cardShadow: string;
  cardBorder: string;
}

export interface ThemeAssets {
  homeSvg: string;
  infoSvg?: string;
  fullBackground?: string;
  separatorSvg?: string;
}

export interface MicrositeTheme {
  slug: string;
  label: string;
  plan: ThemePlan;
  bannerMode: ThemeBannerMode;
  fonts: ThemeFonts;
  colors: ThemeColors;
  ui: ThemeUi;
  assets: ThemeAssets;
  framePosition?: "top" | "bottom";
  unifiedDecor?: boolean;
  /** Si false, no pinta el SVG de info en cada sección (solo marco del banner). */
  sectionDecor?: boolean;
  hideBannerFrameWithPhoto?: boolean;
  showSeparator?: boolean;
  lightBannerNav?: boolean;
  headingUppercase?: boolean;
  letterSpacing?: string;
  /** Opacidad del overlay sobre foto (0–1). false = sin overlay. */
  bannerPhotoOverlay?: number | false;
}

export type ThemeSlug = MicrositeTheme["slug"];
