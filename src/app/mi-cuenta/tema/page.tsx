import { notFound } from "next/navigation";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
import { ThemePanel } from "@/components/account/ThemePanel";
import { getOwnedBoda, parseMisc } from "@/lib/account/require-boda";
import { getEffectiveFontSlug } from "@/lib/themes/fonts";

export default async function MiCuentaTemaPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  const misc = parseMisc(boda.misc);
  const currentFont = getEffectiveFontSlug(boda.plan, misc.microsite_font);

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/tema"
        section="Tema"
        title="Tema del sitio"
        description="Elegí el diseño visual y la tipografía de tu micrositio. Se aplican al tocarlos."
      />
      <ThemePanel
        currentTheme={boda.micrositeTheme}
        currentFont={currentFont}
        userPlan={boda.plan}
        slug={boda.slug}
      />
    </AccountPageBody>
  );
}
