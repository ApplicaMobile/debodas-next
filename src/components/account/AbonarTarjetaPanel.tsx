"use client";

import { useActionState } from "react";
import { updateAbonarTarjetaAction } from "@/lib/account/actions/abonar";
import type { FormState } from "@/lib/account/form-state";
import type { AbonarTarjetaConfig, TarjetaPago } from "@/lib/bodas/abonar-tarjeta";
import {
  AccountFormActions,
  AccountSection,
  AccountTable,
  accountTableHeadClass,
  accountTableRowClass,
  accountTableTdClass,
  accountTableThClass,
} from "@/components/account/AccountPage";
import { FormAlert } from "@/components/account/FormAlert";
import { Button, Input, Textarea } from "@/components/ui";

const initialState: FormState = {};

export function AbonarTarjetaPanel({
  config,
  pagos,
}: {
  config: AbonarTarjetaConfig;
  pagos: TarjetaPago[];
}) {
  const [state, action, pending] = useActionState(
    updateAbonarTarjetaAction,
    initialState,
  );

  return (
    <AccountSection
      id="abonar-tarjeta"
      title="Abonar tarjeta"
      description="Si completás el título del botón, tus invitados pueden registrar un abono (transferencia + comprobante) desde el micrositio."
    >
      <form action={action} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="titulo_abonar_tarjeta"
            name="titulo_abonar_tarjeta"
            label="Título del botón"
            hint="Así se llama el botón en tu micrositio."
            defaultValue={config.titulo}
            maxLength={80}
            placeholder="Abonar tarjeta"
          />
          <Input
            id="valor_referencia_tarjeta"
            name="valor_referencia_tarjeta"
            label="Valor de referencia"
            hint="Monto orientativo que ven los invitados."
            defaultValue={config.valorReferencia}
            maxLength={40}
            placeholder="15000"
          />
        </div>
        <Textarea
          id="texto_monto_tarjeta"
          name="texto_monto_tarjeta"
          label="Texto del monto"
          defaultValue={config.textoMonto}
          maxLength={300}
          rows={3}
          placeholder="Monto sugerido por invitado"
        />
        <AccountFormActions
          alert={<FormAlert error={state.error} success={state.success} />}
        >
          <Button type="submit" loading={pending} loadingLabel="Guardando…">
            Guardar Abonar tarjeta
          </Button>
        </AccountFormActions>
      </form>

      {pagos.length > 0 ? (
        <div className="mt-8 border-t border-border-subtle pt-6">
          <p className="type-label text-text-primary">
            Abonos recibidos ({pagos.length})
          </p>
          <AccountTable caption="Abonos recibidos" className="mt-3">
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
                  <td className={accountTableTdClass} data-primary="">{pago.nombre}</td>
                  <td className={accountTableTdClass} data-label="Monto">${pago.monto}</td>
                  <td className={accountTableTdClass} data-label="Comprobante">
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
                  <td className={`${accountTableTdClass} text-text-secondary`} data-label="Fecha">
                    {pago.fecha.slice(0, 16).replace("T", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </AccountTable>
        </div>
      ) : null}
    </AccountSection>
  );
}
