import { notFound } from "next/navigation";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
import { CanvaInvitePanel } from "@/components/account/CanvaInvitePanel";
import { InvitationBuilder } from "@/components/account/InvitationBuilder";
import { InviteSharePanel } from "@/components/account/InviteSharePanel";
import { buildMicrositePublicUrl } from "@/lib/account/invite-message";
import {
  getOwnedBoda,
  parseCouple,
  parseEvent,
  parseMisc,
} from "@/lib/account/require-boda";
import { getCoupleDisplayName } from "@/data/bodas";
import { getAppUrl } from "@/lib/email/client";
import {
  parseCanvaLink,
  parseInvitations,
} from "@/lib/invitations/parse";
import { getMicrositePassword } from "@/lib/microsite/password";
import { normalizePlan } from "@/lib/plans/features";

export default async function MiCuentaInvitarPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  const couple = parseCouple(boda.couple);
  const event = parseEvent(boda.event);
  const coupleName = getCoupleDisplayName(couple);
  const brideName =
    String(couple.bride_name ?? couple.bride ?? "").trim() || "Novia";
  const groomName =
    String(couple.groom_name ?? couple.groom ?? "").trim() || "Novio";
  const password = getMicrositePassword(boda.options);
  const hasPassword = Boolean(password);
  const micrositeUrl = buildMicrositePublicUrl(getAppUrl(), boda.slug);
  const misc = parseMisc(boda.misc);
  const invitations = parseInvitations(misc);
  const canvaLink = parseCanvaLink(misc);
  const isPremium = normalizePlan(boda.plan) === "premium";

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/invitar"
        section="Invitar"
        title="Compartir / invitar"
        description="Compartí el link por WhatsApp, creá tarjetas digitales para descargar y, si tenés Premium, sumá mapa o un diseño de Canva."
      />

      <InviteSharePanel
        coupleName={coupleName}
        micrositeUrl={micrositeUrl}
        hasPassword={hasPassword}
      />

      <InvitationBuilder
        invitations={invitations}
        brideName={brideName}
        groomName={groomName}
        isPremium={isPremium}
        eventDate={String(event.date ?? "")}
        eventTime={String(event.time ?? "")}
        aside={
          <CanvaInvitePanel
            canvaLink={canvaLink}
            isPremium={isPremium}
            micrositeUrl={micrositeUrl}
            coupleName={coupleName}
          />
        }
      />
    </AccountPageBody>
  );
}
