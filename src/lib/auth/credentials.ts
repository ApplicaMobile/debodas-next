import { compare } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { migrateWpUserOnLogin } from "@/lib/wp-import";

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
    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionVersion: user.sessionVersion,
      bodaSlug: user.boda?.slug ?? null,
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
    if (!created) {
      return null;
    }
    return {
      id: created.id,
      email: created.email,
      name: created.name,
      role: created.role,
      sessionVersion: created.sessionVersion,
      bodaSlug: created.boda?.slug ?? migrated.bodaSlug,
    };
  } catch (error) {
    console.warn("[verifyCredentials] WP migrate skipped", error);
    return null;
  }
}
