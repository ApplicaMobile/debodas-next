import { notFound } from "next/navigation";
import { FaqPanel } from "@/components/account/ContentPanels";
import { getOwnedBoda } from "@/lib/account/require-boda";

export default async function MiCuentaFaqPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold sm:text-2xl text-stone-800">FAQ</h2>
        <p className="mt-2 text-sm text-stone-600">
          Preguntas frecuentes para tus invitados.
        </p>
      </div>
      <FaqPanel
        items={boda.faqItems
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            id: item.id,
            question: item.question,
            answer: item.answer,
          }))}
      />
    </div>
  );
}
