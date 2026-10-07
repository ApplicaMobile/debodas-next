/**
 * Utilidades para URLs de medios de WordPress compartidas por la
 * importación (que reaplica lo ya rehosteado) y por el rehost.
 */

/** Largo máximo indexable de `legacy_media.original_url` (utf8mb4, 3072 bytes). */
export const MAX_MEDIA_URL_LENGTH = 768;

/** URL canónica para `legacy_media.original_url`: sin query ni hash y con https. */
export function normalizeMediaUrl(url: string): string {
  const trimmed = url.trim();
  const noFragment = trimmed.split("#")[0] ?? "";
  const noQuery = noFragment.split("?")[0] ?? "";
  return noQuery.replace(/^http:\/\//i, "https://");
}

export function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

/** Recolecta todas las URLs http(s) que aparezcan en un valor JSON arbitrario. */
export function collectHttpUrls(value: unknown, out: Set<string> = new Set()): Set<string> {
  if (isHttpUrl(value)) {
    out.add(value.trim());
  } else if (Array.isArray(value)) {
    for (const item of value) collectHttpUrls(item, out);
  } else if (value && typeof value === "object" && !(value instanceof Date)) {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectHttpUrls(item, out);
    }
  }
  return out;
}

/**
 * Devuelve una copia de `value` reemplazando cada string URL por lo que
 * devuelva `replace` (o dejándolo igual si devuelve null/undefined).
 */
export function replaceHttpUrls<T>(value: T, replace: (url: string) => string | null | undefined): T {
  if (isHttpUrl(value)) {
    const next = replace(value.trim());
    return (next ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceHttpUrls(item, replace)) as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = replaceHttpUrls(item, replace);
    }
    return out as T;
  }
  return value;
}

/** Versión async (para el rehost, que descarga mientras recorre). */
export async function replaceHttpUrlsAsync<T>(
  value: T,
  replace: (url: string) => Promise<string | null | undefined>,
): Promise<T> {
  if (isHttpUrl(value)) {
    const next = await replace(value.trim());
    return (next ?? value) as T;
  }
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) out.push(await replaceHttpUrlsAsync(item, replace));
    return out as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = await replaceHttpUrlsAsync(item, replace);
    }
    return out as T;
  }
  return value;
}
