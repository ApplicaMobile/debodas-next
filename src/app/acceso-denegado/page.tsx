import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

interface PageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function AccesoDenegadoPage({ searchParams }: PageProps) {
  const { from } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-screen items-center justify-center bg-[#EBEBEB] px-6 pt-24 pb-16">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
            403
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-stone-800">
            Acceso denegado
          </h1>
          <p className="mt-3 text-stone-600">
            {from === "admin"
              ? "No tenés permisos de administrador para ver ese panel."
              : "No tenés permiso para ver esta página."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/mi-cuenta"
              className="rounded-full bg-[#e6dac7] px-6 py-3 text-sm font-semibold text-stone-800"
            >
              Ir a mi cuenta
            </Link>
            <Link
              href="/"
              className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700"
            >
              Inicio
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
