import { notFound } from "next/navigation";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
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
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/regalos-recibidos"
        section="Regalos recibidos"
        title="Regalos recibidos"
        description="Regalos de invitados por Mercado Pago o transferencia. Revisá los pendientes y acreditalos cuando confirmes el pago."
      />
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
    </AccountPageBody>
  );
}
