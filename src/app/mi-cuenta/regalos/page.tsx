import { notFound } from "next/navigation";
import { GiftsPanel } from "@/components/account/GiftsPanel";
import { getOwnedBoda } from "@/lib/account/require-boda";

export default async function MiCuentaRegalosPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Lista de regalos
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Administrá los regalos que ven tus invitados.
        </p>
      </div>
      <GiftsPanel
        plan={boda.plan}
        listTitle={boda.giftsListTitle ?? "Lista de regalos"}
        gifts={boda.gifts
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((gift) => ({
            id: gift.id,
            title: gift.title,
            price: Number(gift.price),
            quantity: gift.quantity,
          }))}
      />
    </div>
  );
}
