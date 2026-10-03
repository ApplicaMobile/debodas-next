import { notFound } from "next/navigation";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
import { FaqPanel } from "@/components/account/ContentPanels";
import { getOwnedBoda } from "@/lib/account/require-boda";

export default async function MiCuentaFaqPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/faq"
        section="FAQ"
        title="Preguntas frecuentes"
        description="Respondé de antemano las dudas típicas de tus invitados para que encuentren todo en tu micrositio."
      />
      <FaqPanel
        items={boda.faqItems
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            id: item.id,
            question: item.question,
            answer: item.answer,
          }))}
      />
    </AccountPageBody>
  );
}
