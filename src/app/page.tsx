import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { HeroSection } from "@/components/home/HeroSection";
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
        <PlansSection />
        <ThemesSection />
        <ReviewsSection reviews={reviews} />
        <InstagramSection />

        <section className="bg-[#06263a] py-16 text-center text-white">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              ¿Listos para empezar?
            </h2>
            <p className="mt-4 text-white/80">
              Creá tu micrositio en minutos, compartilo con tus invitados y
              recibí confirmaciones y regalos en un solo lugar.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/registro"
                className="rounded-full bg-[#e6dac7] px-8 py-3 text-sm font-semibold text-stone-800"
              >
                Crear mi sitio
              </Link>
              <Link
                href="/bodas/demo"
                className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold text-white"
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
