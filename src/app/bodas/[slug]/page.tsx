import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBannerUrl, getCoupleDisplayName } from "@/data/bodas";
import { getBodaBySlug, getBodaRsvpCount } from "@/lib/bodas/queries";
import { getAppUrl } from "@/lib/email/client";
import {
  getMicrositePassword,
  isMicrositeUnlocked,
} from "@/lib/microsite/password";
import { canAddRsvpGuest } from "@/lib/plans/limits";
import { getTheme, isThemeSlug } from "@/lib/themes/registry";
import { MicrositeDemo } from "@/components/microsite/MicrositeDemo";
import { PasswordGate } from "@/components/microsite/PasswordGate";
import { ThemeProvider } from "@/components/themes/ThemeProvider";
import { ThemeSwitcher } from "@/components/themes/ThemeSwitcher";
import "@/styles/microsite-themes.css";

function toAbsoluteUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const base = getAppUrl();
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

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
  const bannerUrl = toAbsoluteUrl(getBannerUrl(boda));
  const pageUrl = `${getAppUrl()}/bodas/${slug}`;
  const eventPlace = String(boda.event?.place ?? "").trim();
  const eventDate = String(boda.event?.date ?? "").trim();
  const descriptionParts = [
    `Micrositio de casamiento de ${coupleName}`,
    eventDate ? `el ${eventDate}` : null,
    eventPlace ? `en ${eventPlace}` : null,
  ].filter(Boolean);
  const description = descriptionParts.join(" ");

  return {
    title: `${coupleName} | DeBodas`,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${coupleName} | DeBodas`,
      description,
      type: "website",
      url: pageUrl,
      siteName: "DeBodas",
      locale: "es_AR",
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
      description,
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

  const password = getMicrositePassword(boda.options);
  const unlocked = await isMicrositeUnlocked(slug, password);
  if (password && !unlocked) {
    return (
      <PasswordGate
        slug={slug}
        coupleName={getCoupleDisplayName(boda.couple)}
      />
    );
  }

  const rsvpCount = await getBodaRsvpCount(slug);
  const rsvpOpen = canAddRsvpGuest(boda.plan, rsvpCount);
  const showThemeSwitcher = shouldShowThemeSwitcher(slug, themeParam);

  return (
    <ThemeProvider slug={resolvedTheme}>
      {showThemeSwitcher ? <ThemeSwitcher weddingSlug={slug} /> : null}
      <main>
        <MicrositeDemo boda={boda} rsvpOpen={rsvpOpen} />
      </main>
    </ThemeProvider>
  );
}
