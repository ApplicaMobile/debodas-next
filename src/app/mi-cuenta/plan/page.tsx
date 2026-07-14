import { notFound } from "next/navigation";
import { PlanPanel } from "@/components/account/PlanPanel";
import { getOwnedBoda } from "@/lib/account/require-boda";

function optionEnabled(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

export default async function MiCuentaPlanPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  const options = boda.options as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Plan y facturación
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Tu plan actual y opciones del micrositio.
        </p>
      </div>
      <PlanPanel
        plan={boda.plan}
        showFaq={optionEnabled(options.show_faq)}
        showDressCode={optionEnabled(options.show_dress_code)}
      />
    </div>
  );
}
