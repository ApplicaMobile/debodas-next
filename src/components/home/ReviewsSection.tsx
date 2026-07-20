import type { HomeReview } from "@/data/home";

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1 text-[#BA9C5F]">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index}>★</span>
      ))}
    </div>
  );
}

interface ReviewsSectionProps {
  reviews: HomeReview[];
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  return (
    <section className="bg-white py-20" id="opiniones">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
          Lo que dicen nuestras parejas
        </h2>

        {reviews.length === 0 ? (
          <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-6 py-10 text-center">
            <p className="text-stone-600">
              Todavía no hay opiniones publicadas. Cuando apruebes
              calificaciones en el panel admin, van a aparecer acá.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={`${review.name}-${review.comment.slice(0, 24)}`}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-6"
              >
                <Stars count={review.rating} />
                <p className="mt-4 text-sm leading-7 text-stone-600">
                  “{review.comment}”
                </p>
                <p className="mt-5 text-sm font-semibold text-stone-800">
                  {review.name}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
