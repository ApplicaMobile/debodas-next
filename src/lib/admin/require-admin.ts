import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user || !isAdminRole(user.role)) {
    redirect("/acceso-denegado?from=admin");
  }

  return user;
}
