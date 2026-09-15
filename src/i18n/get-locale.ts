import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, detectLocaleFromHeader, LOCALE_COOKIE, parseLocale, type Locale } from "./config";
import { getMessages } from "./dictionary";
import type { Messages } from "./messages/es";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = parseLocale(jar.get(LOCALE_COOKIE)?.value);
  if (jar.get(LOCALE_COOKIE)?.value) {
    return fromCookie;
  }
  const headerList = await headers();
  return detectLocaleFromHeader(headerList.get("accept-language"));
}

export async function getDictionary(): Promise<{ locale: Locale; messages: Messages }> {
  const locale = await getLocale();
  return { locale, messages: getMessages(locale) };
}

export async function getLocaleOrDefault(): Promise<Locale> {
  try {
    return await getLocale();
  } catch {
    return DEFAULT_LOCALE;
  }
}
