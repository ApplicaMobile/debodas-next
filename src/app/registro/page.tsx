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
      <main className="relative min-h-screen overflow-hidden bg-[#EBEBEB] pt-24 pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(230,218,199,0.75),transparent_40%),radial-gradient(circle_at_10%_85%,rgba(6,38,58,0.07),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
          <div className="p-8 sm:p-12">
            <p className="font-serif text-2xl font-semibold tracking-tight text-stone-800">
              DeBodas
            </p>
            <p className="mt-4 text-sm font-medium uppercase tracking-widest text-[#6f5f47]">
              Registro
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
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
            className="relative min-h-[320px] bg-cover bg-center"
            style={{
              backgroundImage: "url('/assets/img/marketing/plan-basico.jpg')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#06263a]/75 via-[#06263a]/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 text-white">
              <p className="font-serif text-2xl font-semibold">
                Empezá en minutos
              </p>
              <p className="mt-2 text-sm text-white/80">
                Sin tarjeta para el plan gratuito. Después podés subir cuando
                quieras.
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
