import { notFound } from "next/navigation";
import { CanvaInvitePanel } from "@/components/account/CanvaInvitePanel";
import { InvitationBuilder } from "@/components/account/InvitationBuilder";
import { InviteSharePanel } from "@/components/account/InviteSharePanel";
import { buildMicrositePublicUrl } from "@/lib/account/invite-message";
import {
  getOwnedBoda,
  parseCouple,
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
  const coupleName = getCoupleDisplayName(couple);
  const brideName =
    String(couple.bride_name ?? couple.bride ?? "").trim() || "Novia";
  const groomName =
    String(couple.groom_name ?? couple.groom ?? "").trim() || "Novio";
  const password = getMicrositePassword(boda.options);
  const micrositeUrl = buildMicrositePublicUrl(getAppUrl(), boda.slug, password);
  const misc = parseMisc(boda.misc);
  const invitations = parseInvitations(misc);
  const canvaLink = parseCanvaLink(misc);
  const isPremium = normalizePlan(boda.plan) === "premium";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-xl font-semibold text-stone-800 sm:text-2xl">
          Compartir / invitar
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Compartí el link por WhatsApp, creá tarjetas digitales para descargar
          y, si tenés Premium, sumá mapa o un diseño de Canva.
        </p>
      </div>

      <InviteSharePanel
        coupleName={coupleName}
        micrositeUrl={micrositeUrl}
        hasPassword={Boolean(password)}
      />

      <InvitationBuilder
        invitations={invitations}
        brideName={brideName}
        groomName={groomName}
        isPremium={isPremium}
      />

      <CanvaInvitePanel
        canvaLink={canvaLink}
        isPremium={isPremium}
        micrositeUrl={micrositeUrl}
        coupleName={coupleName}
      />
    </div>
  );
}
