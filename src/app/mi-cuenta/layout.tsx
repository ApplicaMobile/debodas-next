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
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <Link
              href="/"
              className="text-xs font-medium text-stone-500 hover:text-stone-800 sm:text-sm"
            >
              ← DeBodas
            </Link>
            <h1 className="mt-0.5 truncate font-serif text-xl font-semibold text-stone-800 sm:text-2xl">
              Mi cuenta
            </h1>
            {user?.email ? (
              <p className="truncate text-xs text-stone-500 sm:text-sm">
                {user.email}
              </p>
            ) : null}
          </div>
          <LogoutButton />
        </div>
      </header>

      {user?.boda ? (
        <div className="border-b border-stone-200 bg-white/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-6 sm:py-3">
            <span className="min-w-0 truncate text-stone-600">
              <span className="hidden sm:inline">Micrositio: </span>
              <strong className="text-stone-800">{user.boda.title}</strong>
            </span>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/mi-cuenta/invitar"
                className="font-medium text-[#25D366] hover:underline"
              >
                <span className="sm:hidden">Invitar</span>
                <span className="hidden sm:inline">Compartir / invitar</span>
              </Link>
              <Link
                href={`/bodas/${user.boda.slug}`}
                className="font-medium text-[#6f5f47] hover:underline"
                target="_blank"
              >
                <span className="sm:hidden">Ver sitio ↗</span>
                <span className="hidden sm:inline">Ver sitio público ↗</span>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-10">
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <AccountSidebar />
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
