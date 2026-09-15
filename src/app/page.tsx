import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AdminLanding } from "@/components/home/AdminLanding";
import { HeroSection } from "@/components/home/HeroSection";
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
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

interface HomePageProps {
  searchParams: Promise<{ vista?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { vista } = await searchParams;
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
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/55">
              DeBodas
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
              {t(messages, "home.ctaTitle")}
            </h2>
            <p className="mt-4 text-white/80">{t(messages, "home.ctaLead")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/registro"
                className="rounded-full bg-[#e6dac7] px-8 py-3.5 text-sm font-semibold text-stone-800 transition hover:bg-[#d4c4a8]"
              >
                {t(messages, "home.ctaCreate")}
              </Link>
              <Link
                href="/bodas/demo"
                className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
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
