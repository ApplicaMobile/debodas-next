import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AdminLanding } from "@/components/home/AdminLanding";
import { HeroSection } from "@/components/home/HeroSection";
import { MarketingSectionHeader } from "@/components/home/MarketingSectionHeader";
import { HowItLooksSection } from "@/components/home/HowItLooksSection";
import { InstagramSection } from "@/components/home/InstagramSection";
import { PlansSection } from "@/components/home/PlansSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { StepsSection } from "@/components/home/StepsSection";
import { ThemesSection } from "@/components/home/ThemesSection";
import { WeddingsSection } from "@/components/home/WeddingsSection";
import { getOnlineWeddingsForHome } from "@/lib/bodas/queries";
import { getApprovedHomeReviews } from "@/lib/ratings/queries";
import { getViewer } from "@/lib/auth/viewer";
import { buttonClasses } from "@/components/ui";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

interface HomePageProps {
  searchParams: Promise<{ vista?: string; cuenta?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { vista, cuenta } = await searchParams;
  const viewer = await getViewer();

  if (viewer.isAdmin && vista !== "publica") {
    return <AdminLanding name={viewer.name} email={viewer.email} />;
  }

  const [reviews, weddings, { messages }] = await Promise.all([
    getApprovedHomeReviews(6),
    getOnlineWeddingsForHome(8),
    getDictionary(),
  ]);

  return (
    <>
      <SiteHeader transparent />
      <main>
        {cuenta === "eliminada" ? (
          <div
            role="status"
            className="fixed inset-x-0 top-20 z-40 mx-auto w-[min(92vw,40rem)] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-900 shadow-lg"
          >
            {t(messages, "accountDeletion.doneNotice")}
          </div>
        ) : null}
        <HeroSection />
        <StepsSection />
        <HowItLooksSection />
        <PlansSection />
        <ThemesSection />
        <WeddingsSection weddings={weddings} />
        <ReviewsSection reviews={reviews} />
        <InstagramSection />

        <section className="relative overflow-hidden bg-[#06263a] py-20 text-center text-white sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(230,218,199,0.18),transparent_55%)]" />
          <div className="relative mx-auto max-w-3xl px-6">
            <MarketingSectionHeader
              tone="dark"
              eyebrow="DeBodas"
              title={t(messages, "home.ctaTitle")}
              lead={t(messages, "home.ctaLead")}
            />
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
              <Link
                href="/registro"
                className={buttonClasses({
                  variant: "secundario",
                  size: "lg",
                  className: "w-full sm:w-auto",
                })}
              >
                {t(messages, "home.ctaCreate")}
              </Link>
              <Link
                href="/bodas/demo"
                className="focus-ring inline-flex min-h-14 w-full items-center justify-center rounded-full border border-white/30 px-8 py-4 type-button text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                {t(messages, "home.ctaExample")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
