export const LOCALES = ["es", "en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE = "debodas_locale";
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

/** Country shown next to each language. Spanish uses Argentina, not Spain. */
export const LOCALE_FLAG: Record<Locale, "AR" | "US" | "BR"> = {
  es: "AR",
  en: "US",
  pt: "BR",
};

export const LOCALE_HTML: Record<Locale, string> = {
  es: "es-AR",
  en: "en",
  pt: "pt-BR",
};

export const LOCALE_NUMBER: Record<Locale, string> = {
  es: "es-AR",
  en: "en-US",
  pt: "pt-BR",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}

export function parseLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function detectLocaleFromHeader(header: string | null): Locale {
  if (!header) {
    return DEFAULT_LOCALE;
  }
  const lowered = header.toLowerCase();
  if (lowered.includes("pt")) {
    return "pt";
  }
  if (lowered.includes("en")) {
    return "en";
  }
  return DEFAULT_LOCALE;
}
