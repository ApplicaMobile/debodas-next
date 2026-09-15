import Link from "next/link";
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
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          MercadoPago
        </h2>
        <p className="mt-2 text-stone-600">
          Configurá las credenciales de la plataforma para cobrar planes y
          recibir el webhook. También podés seguir usando variables de entorno
          como respaldo.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link
            href="/admin/pagos"
            className="font-medium text-[#6f5f47] hover:underline"
          >
            Ver pagos y regalos →
          </Link>
          <Link
            href="/admin/estado"
            className="font-medium text-[#6f5f47] hover:underline"
          >
            Estado del sistema →
          </Link>
        </div>
      </section>

      <MercadoPagoSettingsForm
        form={form}
        resolved={resolved}
        webhookUrl={getMercadoPagoWebhookUrl()}
      />
    </div>
  );
}
