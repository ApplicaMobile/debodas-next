import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBannerUrl, getCoupleDisplayName } from "@/data/bodas";
import { getBodaBySlug, getBodaRsvpCount } from "@/lib/bodas/queries";
import { canAddRsvpGuest } from "@/lib/plans/limits";
import { getTheme, isThemeSlug } from "@/lib/themes/registry";
import { MicrositeDemo } from "@/components/microsite/MicrositeDemo";
import { ThemeProvider } from "@/components/themes/ThemeProvider";
import { ThemeSwitcher } from "@/components/themes/ThemeSwitcher";
import "@/styles/microsite-themes.css";

interface BodaPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ theme?: string }>;
}

function shouldShowThemeSwitcher(slug: string, themeParam?: string) {
  if (themeParam && isThemeSlug(themeParam)) {
    return true;
  }
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  return slug === "demo";
}

export async function generateMetadata({
  params,
  searchParams,
}: BodaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { theme: themeParam } = await searchParams;
  const boda = await getBodaBySlug(slug);

  if (!boda) {
    return { title: "Boda no encontrada | DeBodas" };
  }

  const theme = getTheme(themeParam ?? boda.microsite_theme);
  const coupleName = getCoupleDisplayName(boda.couple);
  const bannerUrl = getBannerUrl(boda);
  const eventPlace = String(boda.event?.place ?? "").trim();
  const eventDate = String(boda.event?.date ?? "").trim();
  const descriptionParts = [
    `Micrositio de casamiento de ${coupleName}`,
    eventDate ? `el ${eventDate}` : null,
    eventPlace ? `en ${eventPlace}` : null,
  ].filter(Boolean);

  return {
    title: `${coupleName} | DeBodas`,
    description: descriptionParts.join(" "),
    openGraph: {
      title: `${coupleName} | DeBodas`,
      description: descriptionParts.join(" "),
      type: "website",
      ...(bannerUrl
        ? {
            images: [
              {
                url: bannerUrl,
                alt: `Banner de ${coupleName}`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${coupleName} | DeBodas`,
      description: descriptionParts.join(" "),
      ...(bannerUrl ? { images: [bannerUrl] } : {}),
    },
    other: {
      "theme-color": theme.colors.accent,
    },
  };
}

export default async function BodaPage({ params, searchParams }: BodaPageProps) {
  const { slug } = await params;
  const { theme: themeParam } = await searchParams;
  const boda = await getBodaBySlug(slug);

  if (!boda) {
    notFound();
  }

  const resolvedTheme =
    themeParam && isThemeSlug(themeParam)
      ? themeParam
      : isThemeSlug(boda.microsite_theme)
        ? boda.microsite_theme
        : "marfil";

  const rsvpCount = await getBodaRsvpCount(slug);
  const rsvpOpen = canAddRsvpGuest(boda.plan, rsvpCount);
  const showThemeSwitcher = shouldShowThemeSwitcher(slug, themeParam);

  return (
    <ThemeProvider slug={resolvedTheme}>
      {showThemeSwitcher ? <ThemeSwitcher weddingSlug={slug} /> : null}
      <MicrositeDemo boda={boda} rsvpOpen={rsvpOpen} />
    </ThemeProvider>
  );
}
