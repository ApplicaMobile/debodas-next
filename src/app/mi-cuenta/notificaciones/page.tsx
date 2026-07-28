import { notFound } from "next/navigation";
import { NotificationsHistoryPanel } from "@/components/account/NotificationsHistoryPanel";
import { getOwnedBoda } from "@/lib/account/require-boda";
import { getBodaNotifications } from "@/lib/notifications/queries";

export default async function MiCuentaNotificacionesPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  const { items, unreadCount } = await getBodaNotifications(boda.id, 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-stone-800 sm:text-2xl">
          Notificaciones
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Historial de confirmaciones, regalos y cambios de plan de tu boda.
        </p>
      </div>

      <NotificationsHistoryPanel items={items} unreadCount={unreadCount} />
    </div>
  );
}
