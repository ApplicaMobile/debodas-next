import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function RecuperarPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-screen items-center justify-center bg-[#EBEBEB] px-6 pt-24 pb-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="font-serif text-3xl font-semibold text-stone-800">
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
