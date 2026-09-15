"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { t, type MessageKey } from "@/i18n/dictionary";
import { es, type Messages } from "@/i18n/messages/es";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  messages: es,
  t: (key, vars) => t(es, key, vars),
});

export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider
      value={{
        locale,
        messages,
        t: (key, vars) => t(messages, key, vars),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useTranslations() {
  return useContext(LocaleContext).t;
}
