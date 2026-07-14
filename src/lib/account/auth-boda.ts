import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function requireOwnedBoda() {
  const session = await getSession();
  if (!session) {
    return { error: "Tenés que iniciar sesión." as const, boda: null };
  }

  const boda = await prisma.boda.findUnique({
    where: { userId: session.userId },
  });

  if (!boda) {
    return { error: "No encontramos tu boda." as const, boda: null };
  }

  return { error: null, boda };
}
