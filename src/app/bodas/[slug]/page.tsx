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
import { buildPublicMicrositePayload } from "@/lib/bodas/public-microsite";
import { getTheme, isThemeSlug } from "@/lib/themes/registry";
import { getEffectiveFontSlug, getFontFromMisc } from "@/lib/themes/fonts";
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
  searchParams: Promise<{ theme?: string; embedded?: string }>;
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
  const ogFallback = toAbsoluteUrl("/assets/img/marketing/hero.jpg");
  const ogImageUrl = bannerUrl ?? ogFallback;
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
      images: [
        {
          url: ogImageUrl!,
          width: 1200,
          height: 630,
          alt: bannerUrl
            ? `Banner de ${coupleName}`
            : `DeBodas — ${coupleName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${coupleName} | DeBodas`,
      description,
      images: [ogImageUrl!],
    },
    other: {
      "theme-color": theme.colors.accent,
    },
  };
}

export default async function BodaPage({ params, searchParams }: BodaPageProps) {
  const { slug } = await params;
  const { theme: themeParam, embedded: embeddedParam } = await searchParams;
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

  const passwordSecret = getMicrositePassword(boda.options);
  const unlocked = await isMicrositeUnlocked(slug, passwordSecret);
  if (passwordSecret && !unlocked) {
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
  const fontSlug = getEffectiveFontSlug(
    boda.plan,
    getFontFromMisc((boda.misc ?? {}) as Record<string, unknown>),
  );

  const embedded = embeddedParam === "1";
  const { boda: publicBoda, paymentOptions } =
    buildPublicMicrositePayload(boda);

  return (
    <ThemeProvider
      slug={resolvedTheme}
      fontSlug={fontSlug}
      embedded={embedded}
    >
      {showThemeSwitcher ? <ThemeSwitcher weddingSlug={slug} /> : null}
      <main>
        <MicrositeDemo
          boda={publicBoda}
          paymentOptions={paymentOptions}
          rsvpOpen={rsvpOpen}
        />
      </main>
    </ThemeProvider>
  );
}
