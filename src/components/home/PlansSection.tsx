import Link from "next/link";
import { MarketingSectionHeader } from "@/components/home/MarketingSectionHeader";
import { PlansComparison } from "@/components/home/PlansComparison";
import { Badge, buttonClasses, IconCheck } from "@/components/ui";
import { plans } from "@/data/home";
import { LOCALE_NUMBER } from "@/i18n/config";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";
import { getAccountPlanCards, type AccountPlanId } from "@/lib/plans/comparison";
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

/** Plan de la comparación (/mi-cuenta) → slug de la home. */
const COMPARISON_SLUG: Record<AccountPlanId, keyof typeof PLAN_COPY> = {
  free: "gratuito",
  basico: "basico",
  premium: "premium",
};

export async function PlansSection() {
  const { locale, messages } = await getDictionary();
  const numberLocale = LOCALE_NUMBER[locale];

  // Mismo origen de precios de siempre: producto del plan (env / constante) o fallback de data/home.
  const homePlans = plans.map((plan) => {
    const product = getPlanProduct(plan.slug);
    return {
      plan,
      copy: PLAN_COPY[plan.slug as keyof typeof PLAN_COPY],
      price: product ? formatPlanPriceArs(product.priceArs, numberLocale) : plan.price,
    };
  });

  const comparisonColumns = getAccountPlanCards().map((card) => {
    const slug = COMPARISON_SLUG[card.id];
    const home = homePlans.find((item) => item.plan.slug === slug);
    return {
      id: card.id,
      name: t(messages, PLAN_COPY[slug].name),
      price: home?.price ?? card.priceLabel,
      recommended: slug === "basico",
      rows: card.featureRows,
    };
  });

  return (
    <section id="planes" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <MarketingSectionHeader
          eyebrow={t(messages, "home.plansEyebrow")}
          title={t(messages, "home.plansTitle")}
          lead={t(messages, "home.plansLead")}
        >
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-surface-muted px-4 py-2 type-body-sm text-text-secondary">
            <IconCheck size={16} className="shrink-0 text-status-success-fg" />
            {t(messages, "home.plansNoteShort")}
          </p>
        </MarketingSectionHeader>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {homePlans.map(({ plan, copy, price }) => {
            const featured = plan.slug === "basico";

            return (
              <article
                key={plan.slug}
                className={`relative overflow-hidden rounded-3xl bg-stone-900 text-white shadow-xl ${
                  featured ? "ring-2 ring-[#e6dac7]/70 lg:-translate-y-1" : ""
                }`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-35"
                  style={{ backgroundImage: `url('${plan.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />

                <div className="relative flex h-full flex-col p-7">
                  <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
                    <p className="type-overline text-white/70">
                      {t(messages, "home.planLabel")}
                    </p>
                    {featured ? (
                      <Badge tone="recomendado">{t(messages, "home.planMostChosen")}</Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-2 type-h3">
                    {copy ? t(messages, copy.name) : plan.name}
                  </h3>
                  <p className="mt-3 text-h2 font-semibold tabular-nums">{price}</p>
                  {plan.priceNote ? (
                    <p className="mt-1 type-body-sm text-white/75">
                      {t(messages, "home.planPriceNote")}
                    </p>
                  ) : null}

                  <hr className="my-6 border-white/15" />

                  <p className="type-label text-white/85">
                    {t(messages, "home.planIncludes")}
                  </p>
                  <ul className="mt-4 space-y-3 type-body text-white/90">
                    {(copy?.features ?? plan.features).map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--color-verde-500)]"
                          aria-hidden="true"
                        >
                          <IconCheck size={14} strokeWidth={2.5} />
                        </span>
                        <span>{copy ? t(messages, feature) : feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-8">
                    <Link
                      href="/registro"
                      className={buttonClasses({ variant: "secundario", fullWidth: true })}
                    >
                      {copy ? t(messages, copy.cta) : plan.cta}
                    </Link>
                    <p className="mt-3 text-center type-caption text-white/65">
                      {t(messages, "home.planUnlimited")}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <PlansComparison
          columns={comparisonColumns}
          labels={{
            show: t(messages, "home.plansCompare"),
            hide: t(messages, "home.plansCompareHide"),
            intro: t(messages, "home.plansNote"),
            caption: t(messages, "home.plansCompareCaption"),
            notIncluded: t(messages, "home.plansCompareNotIncluded"),
            recommended: t(messages, "home.planMostChosen"),
          }}
        />
      </div>
    </section>
  );
}
