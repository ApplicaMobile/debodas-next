import { DEFAULT_LOCALE, type Locale } from "./config";
import { en } from "./messages/en";
import { es, type Messages } from "./messages/es";
import { pt } from "./messages/pt";

const dictionaries: Record<Locale, Messages> = { es, en, pt };

export type MessageKey = NestedKeyOf<typeof es>;

type NestedKeyOf<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
        : Prefix extends ""
          ? K
          : `${Prefix}.${K}`;
    }[keyof T & string]
  : never;

export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function t(
  messages: Messages,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current !== "string") {
    return key;
  }
  return interpolate(current, vars);
}
