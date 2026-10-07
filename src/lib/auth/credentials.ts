import { prisma } from "@/lib/db/prisma";
import { checkUserPassword } from "@/lib/auth/legacy-password";
import { migrateWpUserOnLogin } from "@/lib/wp-import";
import { isAccountActive, normalizeAccountStatus, type AccountStatus } from "@/lib/account/status";

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: string;
  sessionVersion: number;
  bodaSlug: string | null;
  /** active o suspended (las eliminadas devuelven null, como credenciales inválidas). */
  status: AccountStatus;
  /** null = registro con el email sin verificar. */
  emailVerifiedAt: Date | null;
} | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { boda: { select: { slug: true } } },
  });

  if (user) {
    // Cuenta eliminada: igual que si no existiera (y nunca se intenta migrar desde WP).
    if (normalizeAccountStatus(user.status) === "deleted") {
      return null;
    }
    // bcrypt de Next y, si falla, hash legado de WordPress (se rehashea al entrar).
    const check = await checkUserPassword(prisma, user, password);
    if (!check.ok) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionVersion: user.sessionVersion,
      bodaSlug: user.boda?.slug ?? null,
      status: normalizeAccountStatus(user.status),
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }

  try {
    const migrated = await migrateWpUserOnLogin({
      email: normalizedEmail,
      password,
    });
    if (!migrated) {
      return null;
    }
    const created = await prisma.user.findUnique({
      where: { id: migrated.userId },
      include: { boda: { select: { slug: true } } },
    });
    if (!created || !isAccountActive(created.status)) {
      return null;
    }
    return {
      id: created.id,
      email: created.email,
      name: created.name,
      role: created.role,
      sessionVersion: created.sessionVersion,
      bodaSlug: created.boda?.slug ?? migrated.bodaSlug,
      status: "active",
      emailVerifiedAt: created.emailVerifiedAt,
    };
  } catch (error) {
    console.warn("[verifyCredentials] WP migrate skipped", error instanceof Error ? error.message : error);
    return null;
  }
}
