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
      <main className="relative min-h-screen overflow-hidden bg-[#EBEBEB] pt-24 pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(230,218,199,0.7),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(6,38,58,0.08),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-5xl items-stretch gap-0 overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <p className="font-serif text-2xl font-semibold tracking-tight text-stone-800">
              DeBodas
            </p>
            <h1 className="mt-4 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
              Ingresar
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Accedé a tu panel para editar el micrositio, ver RSVP y regalos.
            </p>

            <LoginForm nextPath={nextPath} />

            {process.env.NODE_ENV === "development" ? (
              <p className="mt-6 text-center text-xs text-stone-400">
                Dev: demo@debodas.local / demo1234 · admin@debodas.local /
                admin1234
              </p>
            ) : null}

            <p className="mt-4 text-center text-sm text-stone-500">
              ¿No tenés cuenta?{" "}
              <Link
                href="/registro"
                className="font-medium text-[#6f5f47] underline"
              >
                Crear cuenta
              </Link>
            </p>
          </div>

          <div
            className="relative hidden min-h-[420px] bg-cover bg-center md:block"
            style={{
              backgroundImage: "url('/assets/img/marketing/hero.jpg')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#06263a]/80 via-[#06263a]/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 text-white">
              <p className="font-serif text-2xl font-semibold">Tu boda, online</p>
              <p className="mt-2 text-sm text-white/80">
                Confirmaciones, regalos y diseño en un solo lugar.
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
