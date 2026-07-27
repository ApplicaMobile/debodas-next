import Link from "next/link";
import { socialLinks } from "@/data/social";

/**
 * CTA a Instagram (perfil público).
 * No usa Graph API: en WP solo había URL de red social en ACF options.
 */
export function InstagramSection() {
  const { href, handle } = socialLinks.instagram;

  return (
    <section className="relative overflow-hidden bg-[#F5F1E8] py-20 sm:py-24" id="instagram">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(230,218,199,0.9),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(108,195,158,0.18),transparent_40%)]" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
          Comunidad
        </p>
        <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
          Seguinos en Instagram
        </h2>
        <p className="mt-4 text-stone-600">
          Momentos reales de parejas que celebraron con DeBodas.
        </p>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#06263a] px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0a3550]"
        >
          <span aria-hidden className="text-base">
            ✦
          </span>
          Ver {handle}
        </Link>
      </div>
    </section>
  );
}
