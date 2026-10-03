import { notFound } from "next/navigation";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
import { CronogramaPanel } from "@/components/account/ContentPanels";
import { getOwnedBoda } from "@/lib/account/require-boda";

export default async function MiCuentaCronogramaPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/cronograma"
        section="Cronograma"
        title="Cronograma"
        description="Los horarios y momentos del día del evento, para que tus invitados sepan qué pasa y cuándo."
      />
      <CronogramaPanel
        items={boda.scheduleItems
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            id: item.id,
            time: item.time,
            title: item.title,
            description: item.description,
            icon: item.icon,
          }))}
      />
    </AccountPageBody>
  );
}
