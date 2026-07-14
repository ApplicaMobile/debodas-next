import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/session";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  if (session) {
    redirect("/mi-cuenta");
  }

  const { next } = await searchParams;
  const nextPath =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/mi-cuenta";

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

          <p className="mt-6 text-center text-sm text-stone-500">
            Demo local:{" "}
            <span className="font-medium text-stone-700">
              demo@debodas.local
            </span>{" "}
            /{" "}
            <span className="font-medium text-stone-700">demo1234</span>
          </p>

          <p className="mt-4 text-center text-sm text-stone-500">
            <Link href="/registro" className="font-medium text-[#556B2F]">
              Crear cuenta
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
