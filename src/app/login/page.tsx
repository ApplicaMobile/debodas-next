import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LoginForm } from "@/components/auth/LoginForm";
import { isAdminRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

function safeNextPath(next: string | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/mi-cuenta";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);
  const session = await getSession();

  if (session) {
    if (nextPath.startsWith("/admin")) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true },
      });
      if (user && isAdminRole(user.role)) {
        redirect(nextPath);
      }
      redirect("/acceso-denegado?from=admin");
    }
    redirect(nextPath);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-screen items-center justify-center bg-[#EBEBEB] px-6 pt-24 pb-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="font-serif text-3xl font-semibold text-stone-800">
            Ingresar
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Accedé con tu cuenta de DeBodas.
          </p>

          <LoginForm nextPath={nextPath} />

          {process.env.NODE_ENV === "development" ? (
            <p className="mt-6 text-center text-xs text-stone-400">
              Dev: demo@debodas.local / demo1234 · admin@debodas.local /
              admin1234
            </p>
          ) : null}

          <p className="mt-4 text-center text-sm text-stone-500">
            <Link href="/registro" className="font-medium text-[#e6dac7]">
              Crear cuenta
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
