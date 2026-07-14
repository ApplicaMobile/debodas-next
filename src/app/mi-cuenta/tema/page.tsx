import { notFound } from "next/navigation";
import { ThemePanel } from "@/components/account/ThemePanel";
import { getOwnedBoda } from "@/lib/account/require-boda";

export default async function MiCuentaTemaPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Tema del micrositio
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Elegí el diseño visual de tu sitio público.
        </p>
      </div>
      <ThemePanel
        currentTheme={boda.micrositeTheme}
        userPlan={boda.plan}
        slug={boda.slug}
      />
    </div>
  );
}
