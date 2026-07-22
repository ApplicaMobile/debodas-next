"use client";

import { useEffect, useState } from "react";
import type { HomeReview } from "@/data/home";

function Stars({ count }: { count: number }) {
  return (
    <div
      className="flex gap-1 text-[#8a6c31]"
      aria-label={`${count} de 5 estrellas`}
    >
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
      <section className="bg-white py-20" id="opiniones">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            Lo que dicen nuestras parejas
          </h2>
          <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-6 py-10 text-center">
            <p className="text-stone-600">
              Todavía no hay opiniones publicadas. Cuando apruebes
              calificaciones en el panel admin, van a aparecer acá.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const active = reviews[index] ?? reviews[0];

  return (
    <section className="bg-white py-20" id="opiniones">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
          Lo que dicen nuestras parejas
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-stone-600">
          Experiencias reales de quienes organizaron su boda con DeBodas.
        </p>

        <div className="relative mx-auto mt-12 max-w-3xl">
          <article
            key={`${active.name}-${index}`}
            className="rounded-3xl border border-stone-200 bg-stone-50 px-6 py-10 text-center sm:px-10"
          >
            <Stars count={active.rating} />
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
                aria-label="Opinión anterior"
                onClick={() =>
                  setIndex((current) => (current - 1 + count) % count)
                }
                className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
              >
                ‹
              </button>
              <div className="flex gap-2" role="tablist" aria-label="Opiniones">
                {reviews.map((review, i) => (
                  <button
                    key={`${review.name}-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Ver opinión ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      i === index ? "bg-[#8a6c31]" : "bg-stone-300"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Opinión siguiente"
                onClick={() => setIndex((current) => (current + 1) % count)}
                className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
              >
                ›
              </button>
            </div>
          ) : null}
        </div>

        {count > 1 ? (
          <div className="mt-10 hidden gap-4 md:grid md:grid-cols-3">
            {reviews.slice(0, 3).map((review, i) => (
              <button
                key={`card-${review.name}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={`rounded-2xl border p-5 text-left transition ${
                  i === index
                    ? "border-[#e6dac7] bg-[#e6dac7]/15"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <Stars count={review.rating} />
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                  “{review.comment}”
                </p>
                <p className="mt-4 text-sm font-semibold text-stone-800">
                  {review.name}
                </p>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
