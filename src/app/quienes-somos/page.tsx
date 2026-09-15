import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "@/components/layout/MarketingPageShell";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getDictionary();
  return {
    title: t(messages, "about.title"),
    description: t(messages, "about.lead"),
  };
}

export default async function QuienesSomosPage() {
  const { messages } = await getDictionary();
  const features = [
    { number: "01", title: "about.f1Title", description: "about.f1Desc" },
    { number: "02", title: "about.f2Title", description: "about.f2Desc" },
    { number: "03", title: "about.f3Title", description: "about.f3Desc" },
  ] as const;

  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-4xl px-6">
        <header className="text-center">
          <p className="font-serif text-2xl font-semibold tracking-tight text-stone-800">
            DeBodas
          </p>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-stone-800 sm:text-5xl">
            {t(messages, "about.heading")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
            {t(messages, "about.tagline")}
          </p>
        </header>

        <section className="mt-12 space-y-5 rounded-3xl border border-white/70 bg-white/90 p-6 text-base leading-relaxed text-stone-700 shadow-[0_16px_50px_rgba(45,45,45,0.05)] sm:p-10 sm:text-lg">
          <p>{t(messages, "about.p1")}</p>
          <p>{t(messages, "about.p2")}</p>
          <p className="font-medium text-stone-800">{t(messages, "about.p3")}</p>
        </section>

        <section className="mt-16">
          <h2 className="text-center font-serif text-2xl font-semibold text-stone-800 sm:text-3xl">
            {t(messages, "about.platformTitle")}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.number} className="text-center sm:text-left">
                <p className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#06263a] font-serif text-sm font-semibold text-[#e6dac7] sm:mx-0">
                  {feature.number}
                </p>
                <h3 className="mt-4 text-lg font-semibold text-stone-800">
                  {t(messages, feature.title)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  {t(messages, feature.description)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/registro"
            className="rounded-full bg-[#e6dac7] px-8 py-3 text-sm font-semibold text-stone-800 transition hover:bg-[#d4c4a8]"
          >
            {t(messages, "home.heroCta")}
          </Link>
          <Link
            href="/bodas/demo"
            className="rounded-full border border-stone-300 bg-white px-8 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            {t(messages, "home.ctaExample")}
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}
