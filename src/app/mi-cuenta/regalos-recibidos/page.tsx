import { notFound } from "next/navigation";
import { ConfirmedGiftsPanel } from "@/components/account/ConfirmedGiftsPanel";
import { getOwnedBoda } from "@/lib/account/require-boda";
import { prisma } from "@/lib/db/prisma";

export default async function MiCuentaRegalosRecibidosPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  const gifts = await prisma.confirmedGift.findMany({
    where: { bodaId: boda.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold sm:text-2xl text-stone-800">
          Regalos recibidos
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Regalos de invitados por Mercado Pago o transferencia.
        </p>
      </div>
      <ConfirmedGiftsPanel
        gifts={gifts.map((gift) => ({
          id: gift.id,
          participants: gift.participants,
          email: gift.email,
          phone: gift.phone,
          dedication: gift.dedication,
          method: gift.method,
          amount: Number(gift.amount),
          currency: gift.currency,
          confirmed: gift.confirmed,
          voucherUrl: gift.voucherUrl,
          createdAt: gift.createdAt.toISOString(),
          items: Array.isArray(gift.items)
            ? (gift.items as Array<{
                title?: string;
                quantity?: number;
                unitPrice?: number;
              }>)
            : [],
        }))}
      />
    </div>
  );
}
