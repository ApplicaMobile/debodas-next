import { notFound } from "next/navigation";
import { CronogramaPanel } from "@/components/account/ContentPanels";
import { getOwnedBoda } from "@/lib/account/require-boda";

export default async function MiCuentaCronogramaPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Cronograma
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Horarios y momentos del día del evento.
        </p>
      </div>
      <CronogramaPanel
        items={boda.scheduleItems
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            id: item.id,
            time: item.time,
            title: item.title,
            description: item.description,
          }))}
      />
    </div>
  );
}
