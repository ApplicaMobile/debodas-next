import Link from "next/link";
import { plans } from "@/data/home";
import { LOCALE_NUMBER } from "@/i18n/config";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";
import { formatPlanPriceArs, getPlanProduct } from "@/lib/plans/pricing";

const PLAN_COPY = {
  gratuito: {
    name: "home.planFree",
    cta: "home.planCtaFree",
    features: ["home.planFreeF1", "home.planFreeF2", "home.planFreeF3", "home.planFreeF4"],
  },
  basico: {
    name: "home.planBasic",
    cta: "home.planCtaPaid",
    features: ["home.planBasicF1", "home.planBasicF2", "home.planBasicF3", "home.planBasicF4"],
  },
  premium: {
    name: "home.planPremium",
    cta: "home.planCtaPaid",
    features: ["home.planPremiumF1", "home.planPremiumF2", "home.planPremiumF3", "home.planPremiumF4"],
  },
} as const;

export async function PlansSection() {
  const { locale, messages } = await getDictionary();
  const numberLocale = LOCALE_NUMBER[locale];

  return (
    <section id="planes" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
            {t(messages, "home.plansEyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            {t(messages, "home.plansTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
            {t(messages, "home.plansLead")}
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-stone-500">
            {t(messages, "home.plansNote")}
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const copy = PLAN_COPY[plan.slug as keyof typeof PLAN_COPY];
            const product = getPlanProduct(plan.slug);
            const price = product
              ? formatPlanPriceArs(product.priceArs, numberLocale)
              : plan.price;

            return (
              <article
                key={plan.slug}
                className={`relative overflow-hidden rounded-3xl bg-stone-900 text-white shadow-xl ${
                  plan.slug === "basico"
                    ? "ring-2 ring-[#e6dac7]/70 lg:-translate-y-1"
                    : ""
                }`}
              >
                {plan.slug === "basico" ? (
                  <span className="absolute right-4 top-4 z-10 rounded-full bg-[#e6dac7] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-800">
                    {t(messages, "home.planMostChosen")}
                  </span>
                ) : null}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-35"
                  style={{ backgroundImage: `url('${plan.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />

                <div className="relative flex h-full flex-col p-7">
                  <p className="text-sm uppercase tracking-widest text-white/70">
                    {t(messages, "home.planLabel")}
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold">
                    {copy ? t(messages, copy.name) : plan.name}
                  </h3>
                  <p className="mt-2 text-2xl font-semibold">{price}</p>
                  {plan.priceNote ? (
                    <p className="mt-1 text-sm text-white/75">
                      {t(messages, "home.planPriceNote")}
                    </p>
                  ) : null}

                  <p className="mt-8 text-sm font-medium text-white/85">
                    {t(messages, "home.planIncludes")}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-white/85">
                    {(copy?.features ?? plan.features).map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span className="text-[#6CC39E]" aria-hidden>
                          ✓
                        </span>
                        <span>
                          {copy ? t(messages, feature) : feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-8">
                    <Link
                      href="/registro"
                      className="block rounded-full bg-[#e6dac7] px-5 py-3 text-center text-sm font-semibold text-stone-800 transition hover:bg-[#d4c4a8]"
                    >
                      {copy ? t(messages, copy.cta) : plan.cta}
                    </Link>
                    <p className="mt-3 text-center text-xs text-white/65">
                      {t(messages, "home.planUnlimited")}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
