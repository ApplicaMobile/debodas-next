import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItLooksSection } from "@/components/home/HowItLooksSection";
import { InstagramSection } from "@/components/home/InstagramSection";
import { PlansSection } from "@/components/home/PlansSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { StepsSection } from "@/components/home/StepsSection";
import { ThemesSection } from "@/components/home/ThemesSection";
import { getApprovedHomeReviews } from "@/lib/ratings/queries";

export default async function HomePage() {
  const reviews = await getApprovedHomeReviews(6);

  return (
    <>
      <SiteHeader transparent />
      <main>
        <HeroSection />
        <StepsSection />
        <HowItLooksSection />
        <PlansSection />
        <ThemesSection />
        <ReviewsSection reviews={reviews} />
        <InstagramSection />

        <section className="relative overflow-hidden bg-[#06263a] py-20 text-center text-white sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(230,218,199,0.18),transparent_55%)]" />
          <div className="relative mx-auto max-w-3xl px-6">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/55">
              DeBodas
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
              ¿Listos para empezar?
            </h2>
            <p className="mt-4 text-white/80">
              Creá tu micrositio en minutos, compartilo con tus invitados y
              recibí confirmaciones y regalos en un solo lugar.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/registro"
                className="rounded-full bg-[#e6dac7] px-8 py-3.5 text-sm font-semibold text-stone-800 transition hover:bg-[#d4c4a8]"
              >
                Crear mi sitio
              </Link>
              <Link
                href="/bodas/demo"
                className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver ejemplo
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
