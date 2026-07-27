import { notFound } from "next/navigation";
import { InvitadosPanel } from "@/components/account/InvitadosPanel";
import { markRsvpSectionReviewedAction } from "@/lib/account/actions/content";
import { getOwnedBoda } from "@/lib/account/require-boda";
import { normalizePlan } from "@/lib/plans/features";

export default async function MiCuentaInvitadosPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  await markRsvpSectionReviewedAction();
  const isPremium = normalizePlan(boda.plan) === "premium";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-stone-800 sm:text-2xl">
          Invitados / RSVP
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          {isPremium
            ? "Gestioná confirmaciones, menús especiales y mesas."
            : "Gestioná confirmaciones de asistencia."}
        </p>
      </div>
      <InvitadosPanel
        plan={boda.plan}
        guests={boda.rsvpGuests.map((guest) => ({
          id: guest.id,
          name: guest.name,
          email: guest.email,
          status: guest.status,
          menu: guest.menu,
          tableName: guest.tableName,
          notes: guest.notes,
        }))}
      />
    </div>
  );
}
