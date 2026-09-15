import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getViewer } from "@/lib/auth/viewer";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

export default async function RegistroPage() {
  const viewer = await getViewer();
  if (viewer.isAdmin) {
    redirect("/");
  }
  if (viewer.session) {
    redirect("/mi-cuenta");
  }

  const { messages } = await getDictionary();

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
              {t(messages, "auth.registerEyebrow")}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
              {t(messages, "auth.registerTitle")}
            </h1>
            <p className="mt-4 text-stone-600">
              {t(messages, "auth.registerLead")}
            </p>

            <RegisterForm />

            <p className="mt-6 text-sm text-stone-500">
              {t(messages, "auth.hasAccount")}{" "}
              <Link href="/login" className="font-medium text-[#6f5f47] underline">
                {t(messages, "auth.submit")}
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
                {t(messages, "auth.registerSideTitle")}
              </p>
              <p className="mt-2 text-sm text-white/80">
                {t(messages, "auth.registerSideLead")}
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
