import Link from "next/link";
import { heroContent } from "@/data/home";

export function HeroSection() {
  return (
    <section className="relative min-h-[72svh] overflow-hidden sm:min-h-[100svh]">
      <div
        className="debodas-hero-bg absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${heroContent.backgroundImage}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-[#06263a]/85" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#EBEBEB] to-transparent sm:h-40" />

      <div className="relative mx-auto flex min-h-[72svh] max-w-6xl flex-col justify-end px-6 pb-14 pt-28 sm:min-h-[100svh] sm:justify-center sm:pb-28 sm:pt-32">
        <p className="debodas-fade-up font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
          DeBodas
        </p>
        <h1 className="debodas-fade-up-delay-1 mt-4 max-w-2xl text-xl font-medium leading-snug text-white/95 sm:mt-5 sm:text-2xl lg:text-3xl">
          {heroContent.title}
        </h1>
        <p className="debodas-fade-up-delay-2 mt-3 max-w-xl text-base text-white/80 sm:mt-4 sm:text-lg">
          {heroContent.subtitle}
        </p>

        <div className="debodas-fade-up-delay-3 mt-8 flex flex-wrap gap-3 sm:mt-10">
          <Link
            href={heroContent.ctaHref}
            className="rounded-full bg-[#e6dac7] px-8 py-3.5 text-base font-semibold text-stone-800 shadow-lg transition hover:bg-[#d4c4a8] sm:py-4"
          >
            {heroContent.ctaLabel}
          </Link>
          <Link
            href="/bodas/demo"
            className="rounded-full border border-white/60 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:py-4"
          >
            Ver demo
          </Link>
        </div>
      </div>
    </section>
  );
}
