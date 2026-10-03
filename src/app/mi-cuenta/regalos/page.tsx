import { notFound } from "next/navigation";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
import { GiftsPanel } from "@/components/account/GiftsPanel";
import { LocalUploadsNotice } from "@/components/account/LocalUploadsNotice";
import { getOwnedBoda } from "@/lib/account/require-boda";
import { allowsFreeGiftAmount, hidesGiftList } from "@/lib/bodas/options";

export default async function MiCuentaRegalosPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/regalos"
        section="Regalos"
        title="Lista de regalos"
        description="Administrá los regalos que ven tus invitados y cómo se muestra la lista en el micrositio."
      />
      <LocalUploadsNotice />
      <GiftsPanel
        plan={boda.plan}
        listTitle={boda.giftsListTitle ?? "Lista de regalos"}
        freeMount={allowsFreeGiftAmount(boda.options)}
        hideGiftsList={hidesGiftList(boda.options)}
        gifts={boda.gifts
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((gift) => ({
            id: gift.id,
            title: gift.title,
            price: Number(gift.price),
            quantity: gift.quantity,
            imageUrl: gift.imageUrl,
          }))}
      />
    </AccountPageBody>
  );
}
