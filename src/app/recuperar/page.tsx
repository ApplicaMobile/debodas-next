import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function RecuperarPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#EBEBEB] px-6 pt-24 pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(230,218,199,0.7),transparent_40%),radial-gradient(circle_at_85%_75%,rgba(6,38,58,0.07),transparent_45%)]" />
        <div className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-8 shadow-xl">
          <p className="font-serif text-xl font-semibold tracking-tight text-stone-800">
            DeBodas
          </p>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-stone-800">
            Recuperar contraseña
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Te enviamos un enlace a tu email para crear una nueva contraseña.
          </p>
          <ForgotPasswordForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
