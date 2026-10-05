"use client";

import { useEffect, useState } from "react";
import { MarketingSectionHeader } from "@/components/home/MarketingSectionHeader";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { HomeReview } from "@/data/home";

function Stars({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex gap-1 text-[#8a6c31]" aria-label={label}>
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}

interface ReviewsSectionProps {
  reviews: HomeReview[];
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const t = useTranslations();
  const [index, setIndex] = useState(0);
  const count = reviews.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [count]);

  if (count === 0) {
    return (
      <section className="bg-white py-20 sm:py-24" id="opiniones">
        <div className="mx-auto max-w-6xl px-6">
          <MarketingSectionHeader
            eyebrow={t("home.reviewsEyebrow")}
            title={t("home.reviewsTitle")}
          />
          <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-6 py-10 text-center">
            <p className="text-stone-600">{t("home.reviewsEmpty")}</p>
          </div>
        </div>
      </section>
    );
  }

  const active = reviews[index] ?? reviews[0];

  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24" id="opiniones">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#F5F1E8]/80 to-transparent" />
      <div className="relative mx-auto max-w-6xl px-6">
        <MarketingSectionHeader
          eyebrow={t("home.reviewsEyebrow")}
          title={t("home.reviewsTitle")}
          lead={t("home.reviewsLead")}
        />

        <div className="relative mx-auto mt-12 max-w-3xl">
          <article
            key={`${active.name}-${index}`}
            className="rounded-3xl border border-stone-200/80 bg-[#FBF9F5] px-6 py-10 text-center shadow-[0_12px_40px_rgba(0,0,0,0.04)] sm:px-10"
          >
            <Stars
              count={active.rating}
              label={t("home.reviewsStars", { count: active.rating })}
            />
            <p className="mt-6 font-serif text-xl leading-relaxed text-stone-700 sm:text-2xl">
              “{active.comment}”
            </p>
            <p className="mt-6 text-sm font-semibold text-stone-800">
              {active.name}
            </p>
          </article>

          {count > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                aria-label={t("home.reviewsPrev")}
                onClick={() =>
                  setIndex((current) => (current - 1 + count) % count)
                }
                className="focus-ring flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-lg text-stone-700 transition-colors hover:bg-stone-50"
              >
                ‹
              </button>
              <div className="flex" role="tablist" aria-label={t("home.reviewsEyebrow")}>
                {reviews.map((review, i) => (
                  <button
                    key={`${review.name}-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={t("home.reviewsView", { n: i + 1 })}
                    onClick={() => setIndex(i)}
                    className="focus-ring flex h-11 items-center rounded-full px-1"
                  >
                    {/* Punto de 10px en un área de 44px de alto; el activo se alarga. */}
                    <span
                      aria-hidden="true"
                      className={`block h-2.5 rounded-full transition-all ${
                        i === index ? "w-6 bg-[#8a6c31]" : "w-2.5 bg-stone-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label={t("home.reviewsNext")}
                onClick={() => setIndex((current) => (current + 1) % count)}
                className="focus-ring flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-lg text-stone-700 transition-colors hover:bg-stone-50"
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
