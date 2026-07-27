import Link from "next/link";
import { heroContent } from "@/data/home";

export function HeroSection() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div
        className="debodas-hero-bg absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${heroContent.backgroundImage}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-[#06263a]/85" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#EBEBEB] to-transparent" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-24 pt-32 sm:justify-center sm:pb-28">
        <p className="debodas-fade-up font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
          DeBodas
        </p>
        <h1 className="debodas-fade-up-delay-1 mt-5 max-w-2xl text-xl font-medium leading-snug text-white/95 sm:text-2xl lg:text-3xl">
          {heroContent.title}
        </h1>
        <p className="debodas-fade-up-delay-2 mt-4 max-w-xl text-base text-white/80 sm:text-lg">
          {heroContent.subtitle}
        </p>
        <div className="debodas-fade-up-delay-3 mt-10 flex flex-wrap gap-3">
          <Link
            href={heroContent.ctaHref}
            className="rounded-full bg-[#e6dac7] px-8 py-4 text-base font-semibold text-stone-800 shadow-lg transition hover:bg-[#d4c4a8]"
          >
            {heroContent.ctaLabel}
          </Link>
          <Link
            href="/bodas/demo"
            className="rounded-full border border-white/60 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            Ver demo
          </Link>
        </div>
      </div>
    </section>
  );
}
