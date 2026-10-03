import Link from "next/link";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
import { MercadoPagoSettingsForm } from "@/components/admin/MercadoPagoSettingsForm";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  getMercadoPagoSettingsForForm,
  getMercadoPagoWebhookUrl,
} from "@/lib/mercadopago/config";

export default async function AdminMercadoPagoPage() {
  await requireAdmin();
  const { form, resolved } = await getMercadoPagoSettingsForForm();

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/mercadopago"
        area="Panel admin"
        section="Pagos"
        title="MercadoPago"
        description="Configurá las credenciales de la plataforma para cobrar planes y recibir el webhook. También podés seguir usando variables de entorno como respaldo."
        meta={
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              { href: "/admin/pagos", label: "Ver pagos y regalos" },
              { href: "/admin/estado", label: "Estado del sistema" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="focus-ring inline-flex min-h-9 items-center gap-1 rounded-sm type-body-sm font-semibold text-text-link hover:underline"
                >
                  {link.label} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        }
      />

      <MercadoPagoSettingsForm
        form={form}
        resolved={resolved}
        webhookUrl={getMercadoPagoWebhookUrl()}
      />
    </AccountPageBody>
  );
}
