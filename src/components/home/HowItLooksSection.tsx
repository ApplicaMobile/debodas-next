import Link from "next/link";

/**
 * Bloque “cómo se ve” — puente entre marketing y el micrositio real.
 */
export function HowItLooksSection() {
  return (
    <section
      id="como-se-ve"
      className="relative overflow-hidden bg-[#F5F1E8] py-20"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_40%,rgba(230,218,199,0.7),transparent_60%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
            Micrositio real
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            Así lo ven tus invitados
          </h2>
          <p className="mt-4 text-lg text-stone-600">
            Countdown, regalos, álbum, ubicación, RSVP y música — en un link
            que compartís por WhatsApp. Probá el demo con cualquiera de los
            temas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/bodas/demo"
              className="rounded-full bg-[#e6dac7] px-6 py-3 text-sm font-semibold text-stone-800 transition hover:bg-[#d4c4a8]"
            >
              Abrir demo
            </Link>
            <Link
              href="/#themes"
              className="rounded-full border border-stone-300 bg-white/70 px-6 py-3 text-sm font-semibold text-stone-800 transition hover:bg-white"
            >
              Ver todos los temas
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            <span className="ml-2 truncate text-xs text-stone-500">
              debodas.com.ar/bodas/demo
            </span>
          </div>
          <iframe
            title="Vista del micrositio demo"
            src="/bodas/demo?embedded=1"
            className="h-[28rem] w-full border-0 bg-white sm:h-[32rem]"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
