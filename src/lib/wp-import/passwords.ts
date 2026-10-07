import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { compare, hash } from "bcryptjs";
import { verifyPhpass } from "@/lib/wp-import/phpass";

/**
 * Hashes de contraseña de WordPress que sabemos verificar.
 *
 * - `wp-bcrypt`: WordPress ≥ 6.8 → `$wp$2y$…` = bcrypt(base64(HMAC-SHA384(trim(clave), "wp-sha384"))).
 * - `bcrypt`: `$2y$` / `$2a$` / `$2b$` "puros" (plugins) → bcrypt(clave).
 * - `phpass`: `$P$` / `$H$` (WordPress ≤ 6.7, MD5 iterado con sal).
 * - `md5`: MD5 hex de 32 caracteres (WordPress muy viejo; `wp_check_password` lo sigue aceptando).
 */
export type WpHashKind = "wp-bcrypt" | "bcrypt" | "phpass" | "md5" | "unknown";

const BCRYPT_PREFIX = /^\$2[aby]\$\d{2}\$/;
const WP_BCRYPT_PREFIX = /^\$wp\$2[aby]\$\d{2}\$/;
const MD5_HEX = /^[a-f0-9]{32}$/i;

export const BCRYPT_COST = 10;

export function classifyWpHash(storedHash: string | null | undefined): WpHashKind {
  const value = (storedHash ?? "").trim();
  if (!value) return "unknown";
  if (WP_BCRYPT_PREFIX.test(value)) return "wp-bcrypt";
  if (BCRYPT_PREFIX.test(value)) return "bcrypt";
  if ((value.startsWith("$P$") || value.startsWith("$H$")) && value.length === 34) {
    return "phpass";
  }
  if (MD5_HEX.test(value)) return "md5";
  return "unknown";
}

export function isSupportedWpHash(storedHash: string | null | undefined): boolean {
  return classifyWpHash(storedHash) !== "unknown";
}

/** Igual que `wp_hash_password()` de WP 6.8 antes de llamar a `password_hash()`. */
export function wpPrehashPassword(password: string): string {
  return createHmac("sha384", "wp-sha384").update(password.trim()).digest("base64");
}

function safeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    // Comparamos igual para no filtrar por tiempo el largo.
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

async function bcryptCompare(candidate: string, bcryptHash: string): Promise<boolean> {
  try {
    return await compare(candidate, bcryptHash);
  } catch {
    return false;
  }
}

/**
 * Verifica una clave contra un hash legado de WordPress.
 * Nunca lanza: ante un hash desconocido o corrupto devuelve `false`.
 */
export async function verifyWpHash(
  password: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  if (!password) return false;
  const value = (storedHash ?? "").trim();
  switch (classifyWpHash(value)) {
    case "wp-bcrypt": {
      const inner = value.slice(3);
      if (await bcryptCompare(wpPrehashPassword(password), inner)) return true;
      // wp_check_password no recorta la clave al verificar; probamos sin trim por compatibilidad.
      if (password !== password.trim()) {
        const raw = createHmac("sha384", "wp-sha384").update(password).digest("base64");
        return bcryptCompare(raw, inner);
      }
      return false;
    }
    case "bcrypt":
      return bcryptCompare(password, value);
    case "phpass":
      return verifyPhpass(password, value);
    case "md5": {
      const digest = createHash("md5").update(password).digest("hex");
      return safeEqualText(digest, value.toLowerCase());
    }
    default:
      return false;
  }
}

/** Hash bcrypt "puro" para guardar en `User.passwordHash`. */
export function hashPasswordForNext(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

/**
 * Hash bcrypt de una clave aleatoria imposible de adivinar. Se usa como
 * `passwordHash` de relleno cuando la clave real vive en `legacyPasswordHash`
 * (la columna es NOT NULL). El login nunca depende de este valor.
 */
export function unusablePasswordHash(): Promise<string> {
  return hash(randomBytes(24).toString("base64url"), BCRYPT_COST);
}

export interface ImportPasswordPlan {
  kind: WpHashKind;
  /** Hash para `User.passwordHash` (bcrypt real o relleno inutilizable). */
  passwordHash: string;
  /** Hash original de WP para verificar en el primer login (o null). */
  legacyPasswordHash: string | null;
  /** True solo si el hash es de un formato que no sabemos verificar. */
  needsReset: boolean;
}

/**
 * Decide qué guardar para un usuario WP nuevo en la importación masiva.
 * - bcrypt puro → se usa directo como `passwordHash`.
 * - `$wp$2y$`, `$P$`, MD5 → relleno inutilizable + hash original en `legacyPasswordHash`.
 * - desconocido / vacío → relleno + `needsReset` (tendrá que usar /recuperar).
 */
export async function planImportPassword(wpHash: string | null | undefined): Promise<ImportPasswordPlan> {
  const value = (wpHash ?? "").trim();
  const kind = classifyWpHash(value);
  if (kind === "bcrypt") {
    return { kind, passwordHash: value, legacyPasswordHash: null, needsReset: false };
  }
  const filler = await unusablePasswordHash();
  if (kind === "unknown") {
    return { kind, passwordHash: filler, legacyPasswordHash: null, needsReset: true };
  }
  return { kind, passwordHash: filler, legacyPasswordHash: value, needsReset: false };
}
