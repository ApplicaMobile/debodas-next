import Link from "next/link";
import { heroContent } from "@/data/home";

export function HeroSection() {
  return (
    <section className="relative min-h-[88vh] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${heroContent.backgroundImage}')` }}
      />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-6 pb-20 pt-32">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-white/80">
          Micrositios de bodas
        </p>
        <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
          {heroContent.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/90 sm:text-xl">
          {heroContent.subtitle}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href={heroContent.ctaHref}
            className="rounded-full bg-[#556B2F] px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-[#465A27]"
          >
            {heroContent.ctaLabel}
          </Link>
          <Link
            href="/bodas/demo"
            className="rounded-full border border-white/70 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            Ver demo
          </Link>
        </div>
      </div>
    </section>
  );
}
