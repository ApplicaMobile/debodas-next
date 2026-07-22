import Link from "next/link";
import { plans } from "@/data/home";
import {
  formatPlanPriceArs,
  getPlanProduct,
} from "@/lib/plans/pricing";

export function PlansSection() {
  const pricedPlans = plans.map((plan) => {
    const product = getPlanProduct(plan.slug);
    if (!product) {
      return plan;
    }
    return {
      ...plan,
      price: formatPlanPriceArs(product.priceArs),
    };
  });

  return (
    <section id="planes" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            Nuestros planes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
            Elegí la experiencia ideal para tu gran día
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-stone-500">
            <strong>Pago único</strong>: pagás una sola vez y tenés{" "}
            <strong>acceso ilimitado</strong> a tu gestor de bodas. Sin
            suscripción mensual.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pricedPlans.map((plan) => (
            <article
              key={plan.slug}
              className="relative overflow-hidden rounded-3xl bg-stone-900 text-white shadow-xl"
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-35"
                style={{ backgroundImage: `url('${plan.image}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />

              <div className="relative flex h-full flex-col p-7">
                <p className="text-sm uppercase tracking-widest text-white/70">
                  Plan
                </p>
                <h3 className="mt-2 text-3xl font-semibold">{plan.name}</h3>
                <p className="mt-2 text-2xl font-semibold">{plan.price}</p>
                {plan.priceNote ? (
                  <p className="mt-1 text-sm text-white/75">{plan.priceNote}</p>
                ) : null}

                <p className="mt-8 text-sm font-medium text-white/85">
                  ¿Qué servicios incluye?
                </p>
                <ul className="mt-4 space-y-2 text-sm text-white/85">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-[#6CC39E]">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  <Link
                    href="/registro"
                    className="block rounded-full bg-[#e6dac7] px-5 py-3 text-center text-sm font-semibold text-stone-800 transition hover:bg-[#d4c4a8]"
                  >
                    {plan.cta}
                  </Link>
                  <p className="mt-3 text-center text-xs text-white/65">
                    Acceso ilimitado. Sin renovaciones automáticas.
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
