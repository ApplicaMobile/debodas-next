import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCoupleDisplayName } from "@/data/bodas";
import { getBodaBySlug } from "@/lib/bodas/queries";
import { getTheme, isThemeSlug } from "@/lib/themes/registry";
import { MicrositeDemo } from "@/components/microsite/MicrositeDemo";
import { ThemeProvider } from "@/components/themes/ThemeProvider";
import { ThemeSwitcher } from "@/components/themes/ThemeSwitcher";
import "@/styles/microsite-themes.css";

interface BodaPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ theme?: string }>;
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

  return {
    title: `${coupleName} · ${theme.label} | DeBodas`,
    description: `Micrositio demo de ${coupleName} con tema ${theme.label}`,
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

  return (
    <ThemeProvider slug={resolvedTheme}>
      <ThemeSwitcher weddingSlug={slug} />
      <MicrositeDemo boda={boda} />
    </ThemeProvider>
  );
}
