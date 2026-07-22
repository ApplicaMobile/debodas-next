import { notFound } from "next/navigation";
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
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold sm:text-2xl text-stone-800">
          Tema del micrositio
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Elegí el diseño visual y la tipografía de tu sitio público.
        </p>
      </div>
      <ThemePanel
        currentTheme={boda.micrositeTheme}
        currentFont={currentFont}
        userPlan={boda.plan}
        slug={boda.slug}
      />
    </div>
  );
}
