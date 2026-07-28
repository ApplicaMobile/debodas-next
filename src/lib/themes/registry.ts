import type { MicrositeTheme, ThemeSlug, ThemeUi } from "./types";

const asset = (path: string) => `/assets/img/themes/${path}`;

const defaultUi: ThemeUi = {
  radiusCard: "1rem",
  radiusButton: "9999px",
  cardBg: "rgba(255,255,255,0.92)",
  cardShadow: "0 12px 40px rgba(0, 0, 0, 0.06)",
  cardBorder: "1px solid rgba(0, 0, 0, 0.06)",
};

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
    ui: { ...defaultUi, ...partial.ui },
    assets: {
      homeSvg: asset(`${slug}-home.svg`),
      separatorSvg: showSeparator ? asset(`separator_${slug}.svg`) : undefined,
      ...partial.assets,
    },
  };
}

export const micrositeThemes: Record<ThemeSlug, MicrositeTheme> = {
  base: createTheme("base", "Base", "free", {
    bannerMode: "svg-hero",
    fonts: {
      heading: "var(--font-playfair)",
      body: "var(--font-montserrat)",
    },
    ui: {
      radiusCard: "1rem",
      radiusButton: "9999px",
      cardBg: "rgba(255,255,255,0.94)",
      cardShadow: "0 10px 28px rgba(55, 55, 54, 0.08)",
      cardBorder: "1px solid rgba(108, 195, 158, 0.18)",
    },
    colors: {
      page: "#f5f5f4",
      text: "#373736",
      textMuted: "#5c5c5c",
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
    fonts: {
      heading: "'Fraunces', Georgia, serif",
      body: "'Source Sans 3', 'Segoe UI', sans-serif",
      googleFontsHref:
        "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&display=swap",
    },
    ui: {
      radiusCard: "1.25rem",
      radiusButton: "9999px",
      cardBg: "rgba(255,252,247,0.94)",
      cardShadow: "0 14px 36px rgba(65, 63, 63, 0.08)",
      cardBorder: "1px solid rgba(230, 218, 199, 0.7)",
    },
    colors: {
      page: "#f3f1eb",
      text: "#413f3f",
      textMuted: "#5f5a52",
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
      heading: "'EB Garamond', Georgia, serif",
      body: "var(--font-montserrat)",
      googleFontsHref:
        "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,600;1,500&display=swap",
    },
    headingUppercase: true,
    letterSpacing: "0.08em",
    ui: {
      radiusCard: "0.85rem",
      radiusButton: "0.65rem",
      cardBg: "rgba(255,255,255,0.95)",
      cardShadow: "0 12px 32px rgba(128, 95, 172, 0.1)",
      cardBorder: "1px solid rgba(128, 95, 172, 0.16)",
    },
    colors: {
      page: "#faf7fb",
      text: "#6a4a94",
      textMuted: "#745a96",
      accent: "#805fac",
      accentHover: "#6d4f93",
      button: "#805fac",
      buttonText: "#ffffff",
      sectionSoft: "#f3ebf8",
      countdownBox: "rgba(255,255,255,0.92)",
      countdownText: "#6a4a94",
      bannerText: "#6a4a94",
    },
    assets: {
      homeSvg: asset("flores-home.svg"),
      infoSvg: asset("flores-informacion.svg"),
    },
  }),

  manantial: createTheme("manantial", "Manantial", "premium", {
    bannerMode: "svg-hero",
    fonts: {
      heading: "'Tangerine', cursive",
      body: "'Raleway', 'Segoe UI', sans-serif",
      googleFontsHref:
        "https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,500;0,600;1,400&family=Tangerine:wght@400;700&display=swap",
    },
    ui: {
      radiusCard: "1.5rem",
      radiusButton: "9999px",
      cardBg: "rgba(255,255,255,0.9)",
      cardShadow: "0 16px 40px rgba(47, 72, 88, 0.1)",
      cardBorder: "1px solid rgba(74, 143, 168, 0.2)",
    },
    colors: {
      page: "#eef6f8",
      text: "#102638",
      textMuted: "#4f6675",
      accent: "#4a8fa8",
      accentHover: "#3d7a90",
      button: "#4a8fa8",
      buttonText: "#ffffff",
      sectionSoft: "#e3f0f4",
      countdownBox: "rgba(255,255,255,0.9)",
      countdownText: "#102638",
      bannerText: "#102638",
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
    bannerPhotoOverlay: false,
    fonts: {
      heading: "'Pinyon Script', cursive",
      body: "'Josefin Sans', 'Segoe UI', sans-serif",
      googleFontsHref:
        "https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Pinyon+Script&display=swap",
    },
    ui: {
      radiusCard: "0.35rem",
      radiusButton: "0.35rem",
      cardBg: "rgba(247,246,242,0.94)",
      cardShadow: "0 10px 28px rgba(112, 112, 112, 0.08)",
      cardBorder: "1px solid rgba(186, 156, 95, 0.28)",
    },
    colors: {
      page: "#f7f1e8",
      text: "#5a5a5a",
      textMuted: "#6e6e6e",
      accent: "#ba9c5f",
      accentHover: "#a8894f",
      button: "#ba9c5f",
      buttonText: "#ffffff",
      sectionSoft: "#f7f6f2",
      countdownBox: "#f7f6f2",
      countdownText: "#5a5a5a",
      bannerText: "#ffffff",
    },
    assets: {
      homeSvg: asset("marfil-home.svg"),
      fullBackground: asset("marfil-banner.png"),
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
    ui: {
      radiusCard: "1.1rem",
      radiusButton: "9999px",
      cardBg: "rgba(255,255,255,0.93)",
      cardShadow: "0 12px 34px rgba(58, 77, 99, 0.1)",
      cardBorder: "1px solid rgba(74, 107, 138, 0.18)",
    },
    colors: {
      page: "#f7fafc",
      text: "#3a4d63",
      textMuted: "#5b7691",
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
    headingUppercase: true,
    letterSpacing: "0.14em",
    fonts: {
      heading: "'Cinzel', Georgia, serif",
      body: "'Lora', Georgia, serif",
      googleFontsHref:
        "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Lora:ital,wght@0,400;0,600;1,400&display=swap",
    },
    ui: {
      radiusCard: "0.15rem",
      radiusButton: "0.15rem",
      cardBg: "rgba(255,255,255,0.96)",
      cardShadow: "0 14px 34px rgba(47, 74, 50, 0.12)",
      cardBorder: "1px solid rgba(90, 122, 98, 0.22)",
    },
    colors: {
      page: "#e8f0e5",
      text: "#3f5a44",
      textMuted: "#4f624f",
      accent: "#5a7a62",
      accentHover: "#4a674f",
      button: "#5a7a62",
      buttonText: "#ffffff",
      sectionSoft: "#eef3ea",
      countdownBox: "rgba(255,255,255,0.97)",
      countdownText: "#3f5a44",
      bannerText: "#3f5a44",
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
    headingUppercase: true,
    letterSpacing: "0.14em",
    fonts: {
      heading: "'Dancing Script', cursive",
      body: "'Libre Baskerville', Georgia, serif",
      googleFontsHref:
        "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap",
    },
    ui: {
      radiusCard: "1.35rem",
      radiusButton: "9999px",
      cardBg: "rgba(255,255,255,0.95)",
      cardShadow: "0 14px 36px rgba(74, 74, 72, 0.08)",
      cardBorder: "1px solid rgba(122, 107, 90, 0.18)",
    },
    colors: {
      page: "#fafaf8",
      text: "#5a6b52",
      textMuted: "#6b6b67",
      accent: "#7a6b5a",
      accentHover: "#695c4d",
      button: "#7a6b5a",
      buttonText: "#ffffff",
      sectionSoft: "#f3f1ec",
      countdownBox: "rgba(255,255,255,0.94)",
      countdownText: "#5a6b52",
      bannerText: "#5a6b52",
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
      hideBannerFrameWithPhoto: false,
      unifiedDecor: false,
      headingUppercase: true,
      letterSpacing: "0.14em",
      fonts: {
        heading: "'Great Vibes', cursive",
        body: "'Cormorant Infant', Georgia, serif",
        googleFontsHref:
          "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Infant:ital,wght@0,400;0,600;1,400&display=swap",
      },
      ui: {
        radiusCard: "0.2rem",
        radiusButton: "0.25rem",
        cardBg: "rgba(255,255,255,0.97)",
        cardShadow: "0 16px 40px rgba(79, 64, 53, 0.12)",
        cardBorder: "1px solid rgba(139, 107, 92, 0.28)",
      },
      colors: {
        page: "#f3eee6",
        text: "#6b5348",
        textMuted: "#6c5b4d",
        accent: "#8b6b5c",
        accentHover: "#75584c",
        button: "#8b6b5c",
        buttonText: "#ffffff",
        sectionSoft: "#f5ede6",
        countdownBox: "rgba(255,255,255,0.97)",
        countdownText: "#6b5348",
        bannerText: "#6b5348",
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
    ["--theme-radius-card" as string]: theme.ui.radiusCard,
    ["--theme-radius-button" as string]: theme.ui.radiusButton,
    ["--theme-card-bg" as string]: theme.ui.cardBg,
    ["--theme-card-shadow" as string]: theme.ui.cardShadow,
    ["--theme-card-border" as string]: theme.ui.cardBorder,
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
