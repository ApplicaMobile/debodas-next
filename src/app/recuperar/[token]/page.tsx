import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function RecuperarTokenPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-screen items-center justify-center bg-[#EBEBEB] px-6 pt-24 pb-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="font-serif text-3xl font-semibold text-stone-800">
            Nueva contraseña
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Elegí una contraseña nueva para tu cuenta.
          </p>
          <ResetPasswordForm token={token} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
