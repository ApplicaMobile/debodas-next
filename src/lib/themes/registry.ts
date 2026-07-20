import type { MicrositeTheme, ThemeSlug } from "./types";

const asset = (path: string) => `/assets/img/themes/${path}`;

function createTheme(
  slug: string,
  label: string,
  plan: MicrositeTheme["plan"],
  partial: Partial<MicrositeTheme> &
    Pick<MicrositeTheme, "bannerMode" | "colors" | "fonts">,
): MicrositeTheme {
  const showSeparator = partial.showSeparator ?? slug !== "marfil";

  return {
    slug,
    label,
    plan,
    showSeparator,
    ...partial,
    assets: {
      homeSvg: asset(`${slug}-home.svg`),
      separatorSvg: showSeparator ? asset(`separator_${slug}.svg`) : undefined,
      ...partial.assets,
    },
  };
}

const defaultFonts = {
  heading: "var(--font-playfair)",
  body: "var(--font-montserrat)",
};

export const micrositeThemes: Record<ThemeSlug, MicrositeTheme> = {
  base: createTheme("base", "Base", "free", {
    bannerMode: "svg-hero",
    fonts: defaultFonts,
    colors: {
      page: "#f5f5f4",
      text: "#373736",
      textMuted: "#6b6b6b",
      accent: "#6cc39e",
      accentHover: "#5ab58f",
      button: "#6cc39e",
      buttonText: "#ffffff",
      sectionSoft: "#ffffff",
      countdownBox: "rgba(255,255,255,0.88)",
      countdownText: "#373736",
      bannerText: "#ffffff",
    },
  }),

  hojas: createTheme("hojas", "Hojas", "basico", {
    bannerMode: "svg-hero",
    fonts: defaultFonts,
    colors: {
      page: "#f3f1eb",
      text: "#413f3f",
      textMuted: "#6b675e",
      accent: "#e6dac7",
      accentHover: "#d4c4a8",
      button: "#e6dac7",
      buttonText: "#3f3a32",
      sectionSoft: "#ebe6da",
      countdownBox: "rgba(255,255,255,0.9)",
      countdownText: "#413f3f",
      bannerText: "#ffffff",
    },
    assets: {
      homeSvg: asset("hojas-home.svg"),
      infoSvg: asset("hojas-informacion.svg"),
    },
  }),

  flores: createTheme("flores", "Flores", "basico", {
    bannerMode: "svg-hero",
    bannerPhotoOverlay: false,
    fonts: {
      heading: "'Times New Roman', Georgia, serif",
      body: "var(--font-montserrat)",
    },
    headingUppercase: true,
    colors: {
      page: "#faf7fb",
      text: "#805fac",
      textMuted: "#8f74b0",
      accent: "#805fac",
      accentHover: "#6d4f93",
      button: "#805fac",
      buttonText: "#ffffff",
      sectionSoft: "#f3ebf8",
      countdownBox: "rgba(255,255,255,0.92)",
      countdownText: "#805fac",
      bannerText: "#805fac",
    },
    assets: {
      homeSvg: asset("flores-home.svg"),
      infoSvg: asset("flores-informacion.svg"),
    },
  }),

  manantial: createTheme("manantial", "Manantial", "premium", {
    bannerMode: "svg-hero",
    fonts: defaultFonts,
    colors: {
      page: "#eef6f8",
      text: "#2f4858",
      textMuted: "#5c7281",
      accent: "#4a8fa8",
      accentHover: "#3d7a90",
      button: "#4a8fa8",
      buttonText: "#ffffff",
      sectionSoft: "#e3f0f4",
      countdownBox: "rgba(255,255,255,0.9)",
      countdownText: "#2f4858",
      bannerText: "#ffffff",
    },
    assets: {
      homeSvg: asset("manantial-home.svg"),
      infoSvg: asset("manantial-informacion.svg"),
    },
  }),

  marfil: createTheme("marfil", "Marfil", "premium", {
    bannerMode: "full-background",
    showSeparator: false,
    lightBannerNav: true,
    fonts: defaultFonts,
    colors: {
      page: "#f7f1e8",
      text: "#707070",
      textMuted: "#949494",
      accent: "#ba9c5f",
      accentHover: "#a8894f",
      button: "#ba9c5f",
      buttonText: "#ffffff",
      sectionSoft: "#f7f6f2",
      countdownBox: "#f7f6f2",
      countdownText: "#707070",
      bannerText: "#ffffff",
    },
    assets: {
      homeSvg: asset("marfil-home.svg"),
      fullBackground:
        "https://debodas.com.ar/wp-content/uploads/2025/11/8_banner.png",
    },
  }),

  "mariposas-azules": createTheme("mariposas-azules", "Mariposas azules", "basico", {
    bannerMode: "frame-overlay",
    hideBannerFrameWithPhoto: true,
    unifiedDecor: true,
    fonts: {
      heading: "'Cormorant Infant', Georgia, serif",
      body: "'Cormorant Infant', Georgia, serif",
      googleFontsHref:
        "https://fonts.googleapis.com/css2?family=Cormorant+Infant:ital,wght@0,400;0,600;1,400&display=swap",
    },
    headingUppercase: true,
    letterSpacing: "0.18em",
    colors: {
      page: "#f7fafc",
      text: "#3a4d63",
      textMuted: "#6b8ba8",
      accent: "#4a6b8a",
      accentHover: "#3a5872",
      button: "#4a6b8a",
      buttonText: "#ffffff",
      sectionSoft: "#e3edf5",
      countdownBox: "rgba(255,255,255,0.92)",
      countdownText: "#3a4d63",
      bannerText: "#3a4d63",
    },
    assets: {
      homeSvg: asset("mariposas-azules-home.svg"),
      infoSvg: asset("mariposas-azules-informacion.svg"),
    },
  }),

  "marco-verde": createTheme("marco-verde", "Marco verde", "premium", {
    bannerMode: "frame-overlay",
    hideBannerFrameWithPhoto: true,
    unifiedDecor: true,
    fonts: {
      heading: "'Cinzel', Georgia, serif",
      body: "'Lora', Georgia, serif",
      googleFontsHref:
        "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Lora:ital,wght@0,400;0,600;1,400&display=swap",
    },
    colors: {
      page: "#e8f0e5",
      text: "#2f4a32",
      textMuted: "#5f735f",
      accent: "#4a6741",
      accentHover: "#3d5536",
      button: "#4a6741",
      buttonText: "#ffffff",
      sectionSoft: "#eef4ea",
      countdownBox: "rgba(255,255,255,0.92)",
      countdownText: "#2f4a32",
      bannerText: "#2f4a32",
    },
    assets: {
      homeSvg: asset("marco-verde-home.svg"),
      infoSvg: asset("marco-verde-informacion.svg"),
    },
  }),

  "marco-blanco": createTheme("marco-blanco", "Marco blanco", "premium", {
    bannerMode: "frame-overlay",
    hideBannerFrameWithPhoto: true,
    unifiedDecor: true,
    fonts: {
      heading: "'Libre Baskerville', Georgia, serif",
      body: "'Libre Baskerville', Georgia, serif",
      googleFontsHref:
        "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap",
    },
    colors: {
      page: "#fafaf8",
      text: "#4a4a48",
      textMuted: "#7a7a76",
      accent: "#8b7355",
      accentHover: "#756044",
      button: "#8b7355",
      buttonText: "#ffffff",
      sectionSoft: "#f3f1ec",
      countdownBox: "rgba(255,255,255,0.94)",
      countdownText: "#4a4a48",
      bannerText: "#4a4a48",
    },
    assets: {
      homeSvg: asset("marco-blanco-home.svg"),
      infoSvg: asset("marco-blanco-informacion.svg"),
    },
  }),

  "marco-flores-inferiores": createTheme(
    "marco-flores-inferiores",
    "Marco flores inferiores",
    "premium",
    {
      bannerMode: "frame-overlay",
      framePosition: "bottom",
      fonts: {
        heading: "'Great Vibes', cursive",
        body: "'Cormorant Infant', Georgia, serif",
        googleFontsHref:
          "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Infant:ital,wght@0,400;0,600;1,400&display=swap",
      },
      colors: {
        page: "#f8f5f0",
        text: "#4f4035",
        textMuted: "#7a6a5d",
        accent: "#7d6b54",
        accentHover: "#695844",
        button: "#7d6b54",
        buttonText: "#ffffff",
        sectionSoft: "#f1ebe3",
        countdownBox: "rgba(255,255,255,0.92)",
        countdownText: "#4f4035",
        bannerText: "#4f4035",
      },
      assets: {
        homeSvg: asset("marco-flores-inferiores-home.svg"),
        infoSvg: asset("marco-flores-inferiores-informacion.svg"),
      },
    },
  ),
};

export const themeList = Object.values(micrositeThemes);

export const defaultThemeSlug: ThemeSlug = "base";

export function isThemeSlug(value: string): value is ThemeSlug {
  return value in micrositeThemes;
}

export function getTheme(slug?: string | null): MicrositeTheme {
  if (slug && isThemeSlug(slug)) {
    return micrositeThemes[slug];
  }
  return micrositeThemes[defaultThemeSlug];
}

export function getThemeCssVariables(
  theme: MicrositeTheme,
): Record<string, string> {
  return {
    ["--theme-page" as string]: theme.colors.page,
    ["--theme-text" as string]: theme.colors.text,
    ["--theme-text-muted" as string]: theme.colors.textMuted,
    ["--theme-accent" as string]: theme.colors.accent,
    ["--theme-accent-hover" as string]: theme.colors.accentHover,
    ["--theme-button" as string]: theme.colors.button,
    ["--theme-button-text" as string]: theme.colors.buttonText,
    ["--theme-section-soft" as string]: theme.colors.sectionSoft,
    ["--theme-countdown-box" as string]: theme.colors.countdownBox,
    ["--theme-countdown-text" as string]: theme.colors.countdownText,
    ["--theme-banner-text" as string]: theme.colors.bannerText,
    ["--theme-font-heading" as string]: theme.fonts.heading,
    ["--theme-font-body" as string]: theme.fonts.body,
    ["--theme-home-frame" as string]: `url('${theme.assets.homeSvg}')`,
    ["--theme-info-decor" as string]: theme.assets.infoSvg
      ? `url('${theme.assets.infoSvg}')`
      : "none",
    ["--theme-full-bg" as string]: theme.assets.fullBackground
      ? `url('${theme.assets.fullBackground}')`
      : "none",
    ["--theme-frame-pos" as string]:
      theme.framePosition === "bottom" ? "center bottom" : "center top",
    ["--theme-letter-spacing" as string]: theme.letterSpacing ?? "normal",
  };
}
