"use client";

import {
  createContext,
  useContext,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  getTheme,
  getThemeCssVariables,
} from "@/lib/themes/registry";
import type { MicrositeTheme, ThemeSlug } from "@/lib/themes/types";

interface ThemeContextValue {
  theme: MicrositeTheme;
  slug: ThemeSlug;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  slug?: string | null;
  children: ReactNode;
}

export function ThemeProvider({ slug, children }: ThemeProviderProps) {
  const value = useMemo(() => {
    const theme = getTheme(slug);
    return { theme, slug: theme.slug as ThemeSlug };
  }, [slug]);

  const cssVars = getThemeCssVariables(value.theme) as CSSProperties;
  const classNames = [
    "microsite-theme",
    `microsite-theme--${value.slug}`,
    value.theme.bannerMode === "frame-overlay" ? "microsite-theme--frame" : "",
    value.theme.unifiedDecor ? "microsite-theme--unified-decor" : "",
    value.theme.bannerMode === "frame-overlay" && !value.theme.unifiedDecor
      ? "microsite-theme--frame-section-decor"
      : "",
    value.theme.bannerMode === "full-background"
      ? "microsite-theme--full-bg"
      : "",
    value.theme.framePosition === "bottom"
      ? "microsite-theme--frame-bottom"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <ThemeContext.Provider value={value}>
      {value.theme.fonts.googleFontsHref ? (
        <link rel="stylesheet" href={value.theme.fonts.googleFontsHref} />
      ) : null}
      <div
        data-theme={value.slug}
        className={classNames}
        style={cssVars}
      >
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
