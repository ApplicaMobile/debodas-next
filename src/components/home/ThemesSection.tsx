"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { themes } from "@/data/home";
import { planLabels } from "@/lib/plans/features";

export function ThemesSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>("[data-theme-card]");
    const amount = card?.offsetWidth ?? 280;
    node.scrollBy({ left: direction * (amount + 16), behavior: "smooth" });
  }

  return (
    <section id="themes" className="bg-[#EBEBEB] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
              Diseños
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
              Elegí tu diseño
            </h2>
            <p className="mt-3 text-base text-stone-600 sm:text-lg">
              Deslizá y abrí cada tema en el micrositio demo real.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50 sm:inline-flex"
              aria-label="Temas anteriores"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50 sm:inline-flex"
              aria-label="Temas siguientes"
            >
              →
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="-mx-6 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:thin]"
        >
          {themes.map((theme) => (
            <Link
              key={theme.slug}
              href={`/bodas/${theme.demoSlug}?theme=${theme.slug}`}
              data-theme-card
              className="group w-[min(78vw,17.5rem)] shrink-0 snap-start overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 sm:w-[15.5rem]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${theme.bannerImage}')` }}
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-x-3 bottom-3 top-3 overflow-hidden rounded-xl border border-white/40 bg-white/90 shadow-lg">
                  <Image
                    src={theme.previewImage}
                    alt={`Tema ${theme.label}`}
                    fill
                    className="object-cover object-top"
                    sizes="280px"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="truncate text-sm font-semibold text-stone-800">
                  {theme.label}
                </span>
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                  {planLabels[theme.plan] ?? theme.plan}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/bodas/demo"
            className="inline-flex rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
          >
            Explorar micrositio demo completo
          </Link>
        </div>
      </div>
    </section>
  );
}
