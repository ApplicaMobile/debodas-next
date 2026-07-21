import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getSession } from "@/lib/auth/session";

export default async function RegistroPage() {
  const session = await getSession();
  if (session) {
    redirect("/mi-cuenta");
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#EBEBEB] pt-28">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
          <div className="p-8 sm:p-12">
            <p className="text-sm font-medium uppercase tracking-widest text-[#6f5f47]">
              Registro
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold text-stone-800">
              Creá tu cuenta
            </h1>
            <p className="mt-4 text-stone-600">
              Completá los 3 pasos y creá tu micrositio de boda. Al terminar
              entrás directamente a tu panel.
            </p>

            <RegisterForm />

            <p className="mt-6 text-sm text-stone-500">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="font-medium text-[#6f5f47] underline">
                Ingresar
              </Link>
            </p>
          </div>

          <div
            className="min-h-[320px] bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://test.debodas.com.ar/wp-content/uploads/2026/06/2-3.jpg')",
            }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
