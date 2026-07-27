"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  getTheme,
  getThemeCssVariables,
} from "@/lib/themes/registry";
import {
  getFontCssStack,
  micrositeFonts,
  sanitizeMicrositeFont,
  type MicrositeFontSlug,
} from "@/lib/themes/fonts";
import type { MicrositeTheme, ThemeSlug } from "@/lib/themes/types";

interface ThemeContextValue {
  theme: MicrositeTheme;
  slug: ThemeSlug;
  fontSlug: MicrositeFontSlug;
  embedded: boolean;
}

function detectEmbedded(embeddedProp: boolean): boolean {
  if (embeddedProp) return true;
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  slug?: string | null;
  fontSlug?: string | null;
  /** Vista embebida en iframe (home / panel tema). Evita background-attachment: fixed. */
  embedded?: boolean;
  children: ReactNode;
}

export function ThemeProvider({
  slug,
  fontSlug: fontSlugProp,
  embedded: embeddedProp = false,
  children,
}: ThemeProviderProps) {
  const [embedded, setEmbedded] = useState(() => detectEmbedded(embeddedProp));

  useEffect(() => {
    if (embeddedProp) return;
    setEmbedded(detectEmbedded(false));
  }, [embeddedProp]);

  const value = useMemo(() => {
    const theme = getTheme(slug);
    const fontSlug = sanitizeMicrositeFont(fontSlugProp);
    return {
      theme,
      slug: theme.slug as ThemeSlug,
      fontSlug,
      embedded,
    };
  }, [slug, fontSlugProp, embedded]);

  const cssVars = useMemo(() => {
    const base = getThemeCssVariables(value.theme) as CSSProperties;
    const stack = getFontCssStack(value.fontSlug);
    if (!stack) return base;
    return {
      ...base,
      ["--theme-font-heading" as string]: stack,
      ["--theme-font-body" as string]: stack,
    } as CSSProperties;
  }, [value.theme, value.fontSlug]);

  const classNames = [
    "microsite-theme",
    `microsite-theme--${value.slug}`,
    value.theme.bannerMode === "frame-overlay" ? "microsite-theme--frame" : "",
    value.theme.unifiedDecor ? "microsite-theme--unified-decor" : "",
    value.theme.bannerMode === "frame-overlay" &&
    !value.theme.unifiedDecor &&
    value.theme.sectionDecor !== false
      ? "microsite-theme--frame-section-decor"
      : "",
    value.theme.bannerMode === "full-background"
      ? "microsite-theme--full-bg"
      : "",
    value.theme.framePosition === "bottom"
      ? "microsite-theme--frame-bottom"
      : "",
    value.fontSlug !== "tema-default" ? "microsite-theme--custom-font" : "",
    embedded ? "microsite-theme--embedded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const customFontHref = micrositeFonts[value.fontSlug]?.googleFontsHref;
  const themeFontHref =
    value.fontSlug === "tema-default"
      ? value.theme.fonts.googleFontsHref
      : undefined;

  return (
    <ThemeContext.Provider value={value}>
      {themeFontHref ? (
        <link rel="stylesheet" href={themeFontHref} />
      ) : null}
      {customFontHref ? (
        <link rel="stylesheet" href={customFontHref} />
      ) : null}
      <div data-theme={value.slug} className={classNames} style={cssVars}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useMicrositeTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useMicrositeTheme must be used within ThemeProvider");
  }
  return context;
}
