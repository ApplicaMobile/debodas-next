import { isAdminRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function getViewer() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      role: null,
      isAdmin: false,
      name: null,
      email: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, name: true, email: true },
  });

  return {
    session,
    role: user?.role ?? null,
    isAdmin: isAdminRole(user?.role),
    name: user?.name ?? null,
    email: user?.email ?? session.email,
  };
}
