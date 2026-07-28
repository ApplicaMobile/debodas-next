"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Preview del micrositio: el iframe solo carga cuando entra en viewport.
 */
export function HowItLooksSection() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = frameRef.current;
    if (!node || shouldLoad) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <section
      id="como-se-ve"
      className="relative overflow-hidden bg-[#06263a] py-20 text-white sm:py-24"
    >
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#e6dac7]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#6cc39e]/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/60">
            Micrositio real
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
            Así lo ven tus invitados
          </h2>
          <p className="mt-4 text-lg text-white/75">
            Countdown, regalos, álbum, ubicación, RSVP y música — en un link
            que compartís por WhatsApp. Probá el demo con cualquiera de los
            temas.
          </p>
          <ol className="mt-6 space-y-3 text-sm text-white/80">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 font-semibold text-[#e6dac7]">
                1
              </span>
              <span>Abrí el demo y recorré las secciones.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 font-semibold text-[#e6dac7]">
                2
              </span>
              <span>Probá RSVP o la lista de regalos como invitado.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 font-semibold text-[#e6dac7]">
                3
              </span>
              <span>Creá tu cuenta y personalizá el tuyo en minutos.</span>
            </li>
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/bodas/demo"
              className="rounded-full bg-[#e6dac7] px-6 py-3 text-sm font-semibold text-stone-800 transition hover:bg-[#d4c4a8]"
            >
              Abrir demo
            </Link>
            <Link
              href="/#themes"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ver todos los temas
            </Link>
          </div>
        </div>

        <div
          ref={frameRef}
          className="overflow-hidden rounded-[1.5rem] border border-white/15 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
        >
          <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            <span className="ml-2 truncate text-xs text-stone-500">
              debodas.com.ar/bodas/demo
            </span>
          </div>
          {shouldLoad ? (
            <iframe
              title="Vista del micrositio demo"
              src="/bodas/demo?embedded=1"
              className="h-[28rem] w-full border-0 bg-white sm:h-[34rem]"
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-[28rem] items-center justify-center bg-stone-100 sm:h-[34rem]"
              aria-hidden
            >
              <div className="space-y-3 text-center">
                <div className="mx-auto h-10 w-40 animate-pulse rounded-full bg-stone-200" />
                <div className="mx-auto h-3 w-56 animate-pulse rounded bg-stone-200" />
                <div className="mx-auto h-3 w-40 animate-pulse rounded bg-stone-200" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
