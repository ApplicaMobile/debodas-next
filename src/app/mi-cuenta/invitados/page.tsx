import { notFound } from "next/navigation";
import {
  AccountPageBody,
  AccountPageHeader,
  AccountSection,
  AccountTable,
  accountTableHeadClass,
  accountTableRowClass,
  accountTableTdClass,
  accountTableThClass,
} from "@/components/account/AccountPage";
import { Badge } from "@/components/ui";
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
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/invitados"
        section="Invitados"
        title="Invitados y RSVP"
        description={
          isPremium
            ? "Gestioná confirmaciones, menús especiales y mesas."
            : "Gestioná confirmaciones de asistencia."
        }
      />
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
        <AccountSection
          id="invitados-abonos"
          title="Abonos de tarjeta"
          description="Comprobantes enviados desde el micrositio."
          badge={
            <Badge tone="neutro" icon={false}>
              {pagos.length}
            </Badge>
          }
        >
          <AccountTable caption="Abonos de tarjeta">
            <thead className={accountTableHeadClass}>
              <tr>
                <th className={accountTableThClass}>Nombre</th>
                <th className={accountTableThClass}>Monto</th>
                <th className={accountTableThClass}>Comprobante</th>
                <th className={accountTableThClass}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago) => (
                <tr key={pago.id} className={accountTableRowClass}>
                  <td className={accountTableTdClass}>{pago.nombre}</td>
                  <td className={`${accountTableTdClass} tabular-nums`}>
                    {formatPrice(pago.monto)}
                  </td>
                  <td className={accountTableTdClass}>
                    {pago.comprobante_url ? (
                      <a
                        href={pago.comprobante_url}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring rounded-sm font-semibold text-text-link underline-offset-2 hover:underline"
                      >
                        Ver
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={`${accountTableTdClass} text-text-secondary`}>
                    {pago.fecha.slice(0, 16).replace("T", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </AccountTable>
        </AccountSection>
      ) : null}
    </AccountPageBody>
  );
}
