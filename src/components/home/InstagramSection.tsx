import Link from "next/link";
import { socialLinks } from "@/data/social";

/**
 * CTA a Instagram (perfil público).
 * No usa Graph API: en WP solo había URL de red social en ACF options.
 */
export function InstagramSection() {
  const { href, handle } = socialLinks.instagram;

  return (
    <section className="bg-[#F5F1E8] py-20" id="instagram">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
          Seguinos en Instagram
        </h2>
        <p className="mt-3 text-stone-600">
          Momentos reales de parejas que celebraron con DeBodas.
        </p>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[#e6dac7] px-8 py-3 text-sm font-semibold text-stone-800 transition hover:bg-[#d4c4a8]"
        >
          Ver {handle}
        </Link>
      </div>
    </section>
  );
}
