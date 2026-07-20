import { notFound } from "next/navigation";
import { PlanPanel } from "@/components/account/PlanPanel";
import { getOwnedBoda } from "@/lib/account/require-boda";
import { isMercadoPagoConfigured } from "@/lib/mercadopago/config";
import { isDemoPlanSwitchEnabled } from "@/lib/plans/demo";

function optionEnabled(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

interface MiCuentaPlanPageProps {
  searchParams: Promise<{ payment?: string }>;
}

export default async function MiCuentaPlanPage({
  searchParams,
}: MiCuentaPlanPageProps) {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  const { payment } = await searchParams;
  const options = boda.options as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold sm:text-2xl text-stone-800">
          Plan y facturación
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Compará planes, mejorá el tuyo y configurá opciones del micrositio.
        </p>
      </div>
      <PlanPanel
        plan={boda.plan}
        showFaq={optionEnabled(options.show_faq)}
        showDressCode={optionEnabled(options.show_dress_code)}
        isOnline={boda.isOnline}
        mpConfigured={isMercadoPagoConfigured()}
        demoPlanSwitch={isDemoPlanSwitchEnabled()}
        paymentNotice={payment ?? null}
        giftCount={boda.gifts.length}
        guestCount={boda.rsvpGuests.length}
      />
    </div>
  );
}
