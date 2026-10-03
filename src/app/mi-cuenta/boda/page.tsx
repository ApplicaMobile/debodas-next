import { notFound } from "next/navigation";
import { AbonarTarjetaPanel } from "@/components/account/AbonarTarjetaPanel";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
import { BodaForm } from "@/components/account/BodaForm";
import { Button, IconExternalLink } from "@/components/ui";
import {
  getAbonarConfig,
  getTarjetaPagos,
} from "@/lib/bodas/abonar-tarjeta";
import {
  getOwnedBoda,
  parseCouple,
  parseEvent,
  parseMisc,
} from "@/lib/account/require-boda";

export default async function MiCuentaBodaPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  const couple = parseCouple(boda.couple);
  const event = parseEvent(boda.event);
  const misc = parseMisc(boda.misc);
  const options = (boda.options ?? {}) as Record<string, unknown>;
  const hasPassword =
    typeof options.password === "string" && options.password.trim().length > 0;

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/boda"
        section="Datos"
        title="Datos de la boda"
        description="La información principal que ven tus invitados en el micrositio: nombres, fecha, lugar y acceso."
        actions={
          <Button
            href={`/bodas/${boda.slug}`}
            target="_blank"
            variant="secundario"
            icon={<IconExternalLink />}
            iconPosition="end"
          >
            Ver micrositio
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </Button>
        }
      />

      <BodaForm
        initialValues={{
          title: boda.title,
          brideName: String(couple.bride_name ?? couple.bride ?? ""),
          groomName: String(couple.groom_name ?? couple.groom ?? ""),
          eventDate: String(event.date ?? ""),
          eventTime: String(event.time ?? ""),
          eventPlace: String(event.place ?? ""),
          ourStory: String(misc.our_story ?? ""),
          spotifyUrl: String(misc.spotify_url ?? misc.spotify ?? ""),
          slug: boda.slug,
          hasPassword,
          plan: boda.plan,
        }}
      />

      <AbonarTarjetaPanel
        config={getAbonarConfig(misc)}
        pagos={getTarjetaPagos(misc)}
      />
    </AccountPageBody>
  );
}
