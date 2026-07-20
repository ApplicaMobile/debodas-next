/**
 * Helpers to read ACF-style flat postmeta from a WordPress dump.
 */
export type MetaMap = Map<string, string>;

export function rowsToMeta(
  rows: Array<{ meta_key: string; meta_value: string | null }>,
): MetaMap {
  const map: MetaMap = new Map();
  for (const row of rows) {
    if (!row.meta_key.startsWith("_")) {
      map.set(row.meta_key, row.meta_value ?? "");
    }
  }
  return map;
}

export function metaGet(meta: MetaMap, key: string, fallback = ""): string {
  return repairSpanishLostAccents((meta.get(key) ?? fallback).trim());
}

/**
 * Hostinger dump replaced many UTF-8 accents with literal "?".
 * Recover the most common Spanish patterns (best-effort).
 */
export function repairSpanishLostAccents(input: string): string {
  if (!input || !input.includes("?")) {
    return input;
  }

  let s = input;

  // Opening ¿ when "?" starts a question word
  s = s.replace(/(^|[\s(\[])\?([A-Za-zÁÉÍÓÚÑáéíóúñ])/g, "$1¿$2");

  const pairs: Array<[RegExp, string]> = [
    [/ci\?n/gi, "ción"],
    [/si\?n/gi, "sión"],
    [/ti\?n/gi, "tión"],
    [/xi\?n/gi, "xión"],
    [/gi\?n/gi, "gión"],
    [/a\?os/gi, "años"],
    [/a\?o(?![a-z])/gi, "año"],
    [/ni\?os/gi, "niños"],
    [/ni\?o(?![a-z])/gi, "niño"],
    [/espa\?a/gi, "españa"],
    [/ma\?ana/gi, "mañana"],
    [/compa\?ero/gi, "compañero"],
    [/compa\?era/gi, "compañera"],
    [/se\?or/gi, "señor"],
    [/se\?ora/gi, "señora"],
    [/drag\?n/gi, "dragón"],
    [/jard\?n/gi, "jardín"],
    [/t\?cnicas/gi, "técnicas"],
    [/t\?cnica/gi, "técnica"],
    [/a\?reo/gi, "aéreo"],
    [/a\?rea/gi, "aérea"],
    [/sesi\?n/gi, "sesión"],
    [/m\?sica/gi, "música"],
    [/fotograf\?a/gi, "fotografía"],
    [/fotograf\?as/gi, "fotografías"],
    [/d\?a(?![a-z])/gi, "día"],
    [/d\?as/gi, "días"],
    [/men\?/gi, "menú"],
    [/c\?digo/gi, "código"],
    [/n\?mero/gi, "número"],
    [/n\?meros/gi, "números"],
    [/tel\?fono/gi, "teléfono"],
    [/direcci\?n/gi, "dirección"],
    [/ubicaci\?n/gi, "ubicación"],
    [/decoraci\?n/gi, "decoración"],
    [/invitaci\?n/gi, "invitación"],
    [/invitaci\?nes/gi, "invitaciones"],
    [/confirmaci\?n/gi, "confirmación"],
    [/finalizaci\?n/gi, "finalización"],
    [/informaci\?n/gi, "información"],
    [/organizaci\?n/gi, "organización"],
    [/celebraci\?n/gi, "celebración"],
    [/recepci\?n/gi, "recepción"],
    [/ceremonia\?/gi, "ceremonia"],
    [/cu\?l/gi, "cuál"],
    [/cu\?ndo/gi, "cuándo"],
    [/c\?mo/gi, "cómo"],
    [/d\?nde/gi, "dónde"],
    [/qu\?/gi, "qué"],
    [/qui\?n/gi, "quién"],
    [/qui\?nes/gi, "quiénes"],
    [/tambi\?n/gi, "también"],
    [/despu\?s/gi, "después"],
    [/aqu\?/gi, "aquí"],
    [/all\?/gi, "allí"],
    [/f\?cil/gi, "fácil"],
    [/dif\?cil/gi, "difícil"],
    [/r\?pido/gi, "rápido"],
    [/p\?gina/gi, "página"],
    [/cr\?dito/gi, "crédito"],
    [/d\?bito/gi, "débito"],
    [/agust\?n/gi, "agustín"],
    [/jer\?nimo/gi, "jerónimo"],
    [/mar\?a/gi, "maría"],
    [/jos\?/gi, "josé"],
    [/andr\?s/gi, "andrés"],
    [/mart\?n/gi, "martín"],
    [/hern\?n/gi, "hernán"],
    [/ram\?n/gi, "ramón"],
    [/le\?n/gi, "león"],
    [/bel\?n/gi, "belén"],
    [/miri\?m/gi, "miriam"],
  ];

  for (const [re, replacement] of pairs) {
    s = s.replace(re, (match) => {
      // Preserve original casing of first letter when possible
      if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      if (match === match.toUpperCase()) {
        return replacement.toUpperCase();
      }
      return replacement;
    });
  }

  // Trailing stressed -?n in ALL CAPS names: AGUST?N → AGUSTÍN
  s = s.replace(/([A-ZÁÉÍÓÚÑ]{2,})\?N\b/g, "$1ÍN");
  // Title-ish: Nombre?n → Nombrón is wrong; prefer ín for short endings
  s = s.replace(/([A-Za-zÁÉÍÓÚáéíóú]{3,})\?n\b/g, "$1ón");

  return s;
}

export function metaInt(meta: MetaMap, key: string, fallback = 0): number {
  const raw = metaGet(meta, key);
  if (!raw) {
    return fallback;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function metaBool(meta: MetaMap, key: string): boolean {
  const raw = metaGet(meta, key).toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

/** Read ACF repeater rows: `{prefix}_{i}_{field}` with count at `{prefix}`. */
export function readRepeater(
  meta: MetaMap,
  prefix: string,
  fields: string[],
): Array<Record<string, string>> {
  const count = metaInt(meta, prefix, 0);
  const rows: Array<Record<string, string>> = [];

  for (let i = 0; i < count; i += 1) {
    const row: Record<string, string> = {};
    let hasAny = false;
    for (const field of fields) {
      const value = metaGet(meta, `${prefix}_${i}_${field}`);
      row[field] = value;
      if (value) {
        hasAny = true;
      }
    }
    if (hasAny) {
      rows.push(row);
    }
  }

  return rows;
}

export function normalizePlan(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (value === "premium") {
    return "premium";
  }
  if (value === "basico" || value === "basica" || value === "básico") {
    return "basico";
  }
  // golden / vip / sin-plan → free in Next v1
  return "free";
}

export function mapRsvpStatus(confirmValue: string): string {
  const v = confirmValue.trim();
  if (v === "1" || v === "yes" || v === "confirmed") {
    return "confirmed";
  }
  if (v === "0" || v === "no" || v === "declined") {
    return "declined";
  }
  return "pending";
}

export function mapRsvpMenu(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (["celiaco", "celíaco", "celiac"].includes(v)) {
    return "celiaco";
  }
  if (["vegetariano", "vegetarian"].includes(v)) {
    return "vegetariano";
  }
  if (["vegano", "vegan"].includes(v)) {
    return "vegano";
  }
  // lo_que_venga and unknowns
  return "general";
}

/**
 * Convert WP password hash to something bcryptjs can verify when possible.
 * WP 6.8+ uses `$wp$2y$...` (bcrypt with prefix). Older `$P$` cannot be used.
 */
export function adaptWpPasswordHash(wpHash: string): {
  passwordHash: string;
  needsReset: boolean;
} {
  const hash = wpHash.trim();
  if (hash.startsWith("$wp$2y$") || hash.startsWith("$wp$2a$") || hash.startsWith("$wp$2b$")) {
    // WP stores `$wp` + `$2y$...` → strip only the `$wp` prefix
    return { passwordHash: hash.replace(/^\$wp/, ""), needsReset: false };
  }
  if (hash.startsWith("$2y$") || hash.startsWith("$2a$") || hash.startsWith("$2b$")) {
    return { passwordHash: hash, needsReset: false };
  }
  return { passwordHash: "", needsReset: true };
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
