import { notFound } from "next/navigation";
import { PaymentSettingsPanel } from "@/components/account/PaymentSettingsPanel";
import { getOwnedBoda, parseMisc } from "@/lib/account/require-boda";
import { getPaymentSettingsForForm } from "@/lib/bodas/payment-settings";

export default async function MiCuentaPagosPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  const settings = getPaymentSettingsForForm(parseMisc(boda.misc));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold sm:text-2xl text-stone-800">
          Métodos de pago
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Configurá cómo pueden pagarte tus invitados al regalar. El Access
          Token de Mercado Pago se guarda cifrado.
        </p>
      </div>
      <PaymentSettingsPanel plan={boda.plan} settings={settings} />
    </div>
  );
}
