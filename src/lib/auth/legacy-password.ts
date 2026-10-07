import { compare } from "bcryptjs";
import { hashPasswordForNext, verifyWpHash } from "@/lib/wp-import/passwords";

export interface PasswordCheckUser {
  id: string;
  passwordHash: string;
  legacyPasswordHash: string | null;
}

/** Subconjunto de Prisma que necesita el login (inyectable en tests). */
export interface LegacyPasswordDb {
  user: {
    update(args: {
      where: { id: string };
      data: { passwordHash: string; legacyPasswordHash: null };
    }): Promise<unknown>;
  };
}

export type PasswordCheckResult =
  | { ok: false }
  | { ok: true; via: "bcrypt" }
  | { ok: true; via: "legacy"; rehashed: boolean };

async function safeBcrypt(password: string, stored: string): Promise<boolean> {
  if (!stored || !stored.startsWith("$2")) return false;
  try {
    return await compare(password, stored);
  } catch {
    return false;
  }
}

/**
 * Login con migración transparente de hashes de WordPress:
 * 1. Compara contra `passwordHash` (bcrypt de Next).
 * 2. Si falla y hay `legacyPasswordHash`, verifica el hash WP (`$wp$2y$`, `$P$`, MD5, bcrypt).
 * 3. Si el legado coincide, guarda un bcrypt nuevo y vacía `legacyPasswordHash`.
 */
export async function checkUserPassword(
  db: LegacyPasswordDb,
  user: PasswordCheckUser,
  password: string,
): Promise<PasswordCheckResult> {
  if (!password) return { ok: false };
  if (await safeBcrypt(password, user.passwordHash)) {
    return { ok: true, via: "bcrypt" };
  }
  if (!user.legacyPasswordHash) return { ok: false };
  const legacyOk = await verifyWpHash(password, user.legacyPasswordHash);
  if (!legacyOk) return { ok: false };
  try {
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPasswordForNext(password),
        legacyPasswordHash: null,
      },
    });
    return { ok: true, via: "legacy", rehashed: true };
  } catch (error) {
    console.warn("[login] no se pudo rehashear la clave legada", error instanceof Error ? error.message : error);
    return { ok: true, via: "legacy", rehashed: false };
  }
}
