import { notFound } from "next/navigation";
import { InvitadosPanel } from "@/components/account/InvitadosPanel";
import { getOwnedBoda } from "@/lib/account/require-boda";

export default async function MiCuentaInvitadosPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold sm:text-2xl text-stone-800">
          Invitados / RSVP
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Gestioná confirmaciones de asistencia.
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
          notes: guest.notes,
        }))}
      />
    </div>
  );
}
