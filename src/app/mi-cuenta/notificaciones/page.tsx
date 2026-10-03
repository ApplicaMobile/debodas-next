import { notFound } from "next/navigation";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
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
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/notificaciones"
        section="Notificaciones"
        title="Notificaciones"
        description="Historial de confirmaciones, regalos y cambios de plan de tu boda."
      />
      <NotificationsHistoryPanel items={items} unreadCount={unreadCount} />
    </AccountPageBody>
  );
}
