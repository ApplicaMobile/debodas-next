import { compare } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

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

  if (!user) {
    return null;
  }

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
