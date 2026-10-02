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

function localeFromLanguageTag(tag: string): Locale | null {
  const primary = tag.split("-")[0];
  if (primary === "es" || primary === "en" || primary === "pt") {
    return primary;
  }
  return null;
}

/** Respeta el orden y el peso q de Accept-Language. Español gana si viene primero. */
export function detectLocaleFromHeader(header: string | null): Locale {
  if (!header) {
    return DEFAULT_LOCALE;
  }

  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tagRaw, ...params] = part.trim().split(";");
      const tag = tagRaw.trim().toLowerCase();
      let q = 1;
      for (const param of params) {
        const match = /q\s*=\s*([0-9]*\.?[0-9]+)/i.exec(param);
        if (!match) continue;
        const parsed = Number(match[1]);
        if (!Number.isNaN(parsed)) q = parsed;
      }
      return { tag, q, index };
    })
    .filter((item) => item.tag.length > 0 && item.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const item of ranked) {
    const locale = localeFromLanguageTag(item.tag);
    if (locale) return locale;
  }

  return DEFAULT_LOCALE;
}
