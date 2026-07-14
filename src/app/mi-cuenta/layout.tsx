import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function MiCuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/mi-cuenta");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { boda: { select: { slug: true, title: true } } },
  });

  return (
    <div className="min-h-screen bg-[#EBEBEB]">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-stone-500 hover:text-stone-800"
            >
              ← DeBodas
            </Link>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-stone-800">
              Mi cuenta
            </h1>
            {user?.email ? (
              <p className="text-sm text-stone-500">{user.email}</p>
            ) : null}
          </div>
          <LogoutButton />
        </div>
      </header>

      {user?.boda ? (
        <div className="border-b border-stone-200 bg-white/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-3 text-sm">
            <span className="text-stone-600">
              Micrositio:{" "}
              <strong className="text-stone-800">{user.boda.title}</strong>
            </span>
            <Link
              href={`/bodas/${user.boda.slug}`}
              className="font-medium text-[#556B2F] hover:underline"
              target="_blank"
            >
              Ver sitio público ↗
            </Link>
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <AccountSidebar />
          <div>{children}</div>
        </div>
      </main>
    </div>
  );
}
