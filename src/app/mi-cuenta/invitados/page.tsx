import { notFound } from "next/navigation";
import { InvitadosPanel } from "@/components/account/InvitadosPanel";
import { markRsvpSectionReviewedAction } from "@/lib/account/actions/content";
import { getOwnedBoda } from "@/lib/account/require-boda";
import { getTarjetaPagos } from "@/lib/bodas/abonar-tarjeta";
import { formatPrice } from "@/data/bodas";
import { normalizePlan } from "@/lib/plans/features";

export default async function MiCuentaInvitadosPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  await markRsvpSectionReviewedAction();
  const isPremium = normalizePlan(boda.plan) === "premium";
  const pagos = getTarjetaPagos(boda.misc);

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
      {pagos.length > 0 ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
          <h3 className="text-lg font-semibold text-stone-800">
            Abonos de tarjeta
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Comprobantes enviados desde el micrositio.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-stone-500">
                <tr>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Monto</th>
                  <th className="py-2 pr-3">Comprobante</th>
                  <th className="py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id} className="border-t border-stone-100">
                    <td className="py-2 pr-3">{pago.nombre}</td>
                    <td className="py-2 pr-3">{formatPrice(pago.monto)}</td>
                    <td className="py-2 pr-3">
                      {pago.comprobante_url ? (
                        <a
                          href={pago.comprobante_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#06263a] hover:underline"
                        >
                          Ver
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 text-stone-500">
                      {pago.fecha.slice(0, 16).replace("T", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
