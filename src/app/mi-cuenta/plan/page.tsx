import { notFound } from "next/navigation";
import { PlanPanel } from "@/components/account/PlanPanel";
import { getOwnedBoda } from "@/lib/account/require-boda";
import { isMercadoPagoConfigured } from "@/lib/mercadopago/config";
import { isDemoPlanSwitchEnabled } from "@/lib/plans/demo";
import { syncMercadoPagoReturn } from "@/lib/payments/sync-mp-return";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

function optionEnabled(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

interface MiCuentaPlanPageProps {
  searchParams: Promise<{
    payment?: string;
    collection_id?: string;
    payment_id?: string;
    external_reference?: string;
    status?: string;
    checkout?: string;
  }>;
}

export default async function MiCuentaPlanPage({
  searchParams,
}: MiCuentaPlanPageProps) {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  const query = await searchParams;
  await syncMercadoPagoReturn({
    mpPaymentId: query.payment_id,
    collectionId: query.collection_id,
    externalRef: query.external_reference,
    bodaId: boda.id,
  });
  const latest = (await getOwnedBoda()) ?? boda;
  const options = latest.options as Record<string, unknown>;
  const paymentNotice =
    query.payment ??
    (query.status === "approved" ? "success" : query.status) ??
    null;
  const checkoutError =
    query.checkout === "error"
      ? t((await getDictionary()).messages, "auth.checkoutError")
      : null;

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="type-overline text-text-accent">Mi cuenta · Plan</p>
        <h2 className="mt-2 type-h2 text-text-primary">Plan y facturación</h2>
        <p className="mt-3 type-body-lg text-text-secondary">
          Elegí el plan para tu boda: pagás una sola vez con MercadoPago y no
          hay mensualidad. También podés configurar las opciones del
          micrositio.
        </p>
      </header>
      <PlanPanel
        plan={latest.plan}
        showFaq={optionEnabled(options.show_faq)}
        showDressCode={optionEnabled(options.show_dress_code)}
        isOnline={latest.isOnline}
        freeMount={optionEnabled(options.free_mount)}
        hideGiftsList={optionEnabled(options.hide_gifts_list)}
        mpConfigured={await isMercadoPagoConfigured()}
        demoPlanSwitch={isDemoPlanSwitchEnabled()}
        paymentNotice={paymentNotice}
        checkoutError={checkoutError}
        giftCount={latest.gifts.length}
        guestCount={latest.rsvpGuests.length}
        pictureCount={latest.pictures.length}
      />
    </div>
  );
}
