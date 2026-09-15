import Link from "next/link";
import type { HomeWeddingCard } from "@/lib/bodas/queries";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

interface WeddingsSectionProps {
  weddings: HomeWeddingCard[];
}

export async function WeddingsSection({ weddings }: WeddingsSectionProps) {
  const { messages } = await getDictionary();
  if (weddings.length === 0) {
    return null;
  }

  return (
    <section
      id="bodas"
      className="relative overflow-hidden bg-[#F5F1E8] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
            {t(messages, "home.weddingsEyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            {t(messages, "home.weddingsTitle")}
          </h2>
          <p className="mt-4 text-stone-600">
            {t(messages, "home.weddingsLead")}
          </p>
        </div>

        <div className="mt-12 flex gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]">
          {weddings.map((wedding) => (
            <Link
              key={wedding.slug}
              href={`/bodas/${wedding.slug}`}
              className="group relative h-64 w-64 shrink-0 overflow-hidden rounded-3xl bg-[#06263a] shadow-md sm:h-72 sm:w-72"
            >
              {wedding.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={wedding.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#06263a] to-[#6cc39e]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="font-serif text-xl font-semibold">
                  {wedding.coupleLabel}
                </p>
                <p className="mt-1 text-sm text-white/75">
                  {t(messages, "home.viewMicrosite")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
