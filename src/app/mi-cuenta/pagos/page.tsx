import { notFound } from "next/navigation";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
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
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/pagos"
        section="Pagos"
        title="Métodos de pago"
        description="Configurá cómo pueden pagarte tus invitados al regalar."
      />
      <PaymentSettingsPanel plan={boda.plan} settings={settings} />
    </AccountPageBody>
  );
}
