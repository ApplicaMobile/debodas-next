import Link from "next/link";
import Image from "next/image";
import { themes } from "@/data/home";
import { planLabels } from "@/lib/plans/features";

export function ThemesSection() {
  return (
    <section id="themes" className="bg-[#EBEBEB] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
            Diseños
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            Elegí tu diseño
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
            Abrí cada tema en el micrositio demo real — mismo producto que usan
            las parejas.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {themes.map((theme) => (
            <Link
              key={theme.slug}
              href={`/bodas/${theme.demoSlug}?theme=${theme.slug}`}
              className="group overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.05)] transition hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${theme.bannerImage}')` }}
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-x-4 bottom-4 top-4 overflow-hidden rounded-2xl border border-white/40 bg-white/90 shadow-lg">
                  <Image
                    src={theme.previewImage}
                    alt={`Tema ${theme.label}`}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <span className="inline-flex rounded-full bg-[#E6DAC7] px-4 py-1.5 text-sm font-medium text-stone-800">
                  {theme.label}
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  {planLabels[theme.plan] ?? theme.plan}
                </span>
              </div>
              <p className="px-5 pb-4 text-xs font-medium text-[#6f5f47] opacity-0 transition group-hover:opacity-100">
                Ver en vivo →
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
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
