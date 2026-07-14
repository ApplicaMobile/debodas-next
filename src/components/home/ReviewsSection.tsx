import { reviews } from "@/data/home";

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1 text-[#BA9C5F]">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index}>★</span>
      ))}
    </div>
  );
}

export function ReviewsSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
          Lo que dicen nuestras parejas
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.name}
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
      </div>
    </section>
  );
}
