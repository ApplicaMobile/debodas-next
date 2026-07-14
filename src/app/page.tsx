import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { HeroSection } from "@/components/home/HeroSection";
import { PlansSection } from "@/components/home/PlansSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { StepsSection } from "@/components/home/StepsSection";
import { ThemesSection } from "@/components/home/ThemesSection";

export default function HomePage() {
  return (
    <>
      <SiteHeader transparent />
      <main>
        <HeroSection />
        <StepsSection />
        <PlansSection />
        <ThemesSection />
        <ReviewsSection />

        <section className="bg-[#06263a] py-16 text-center text-white">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              ¿Listos para empezar?
            </h2>
            <p className="mt-4 text-white/80">
              Esta es una demo local 100% React, sin WordPress.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/registro"
                className="rounded-full bg-[#556B2F] px-8 py-3 text-sm font-semibold text-white"
              >
                Crear mi sitio
              </Link>
              <Link
                href="/bodas/demo"
                className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold text-white"
              >
                Ver micrositio demo
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
