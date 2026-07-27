import Link from "next/link";

/**
 * Bloque “cómo se ve” — puente entre marketing y el micrositio real.
 */
export function HowItLooksSection() {
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

        <div className="overflow-hidden rounded-[1.5rem] border border-white/15 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
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
            className="h-[28rem] w-full border-0 bg-white sm:h-[34rem]"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
