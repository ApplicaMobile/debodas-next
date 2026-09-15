"use client";

import { useActionState } from "react";
import { updateAbonarTarjetaAction } from "@/lib/account/actions/abonar";
import type { FormState } from "@/lib/account/form-state";
import type { AbonarTarjetaConfig, TarjetaPago } from "@/lib/bodas/abonar-tarjeta";
import { FormAlert } from "@/components/account/FormAlert";

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
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
      <h3 className="text-lg font-semibold text-stone-800">Abonar tarjeta</h3>
      <p className="mt-1 text-sm text-stone-500">
        Si completás el título del botón, tus invitados pueden registrar un
        abono (transferencia + comprobante) desde el micrositio.
      </p>
      <form action={action} className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-stone-700">
          Título del botón
          <input
            name="titulo_abonar_tarjeta"
            defaultValue={config.titulo}
            maxLength={80}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm"
            placeholder="Abonar tarjeta"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Valor de referencia
          <input
            name="valor_referencia_tarjeta"
            defaultValue={config.valorReferencia}
            maxLength={40}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm"
            placeholder="15000"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Texto del monto
          <textarea
            name="texto_monto_tarjeta"
            defaultValue={config.textoMonto}
            maxLength={300}
            rows={3}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm"
            placeholder="Monto sugerido por invitado"
          />
        </label>
        <FormAlert error={state.error} success={state.success} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar Abonar tarjeta"}
        </button>
      </form>

      {pagos.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <p className="text-sm font-medium text-stone-700">
            Abonos recibidos ({pagos.length})
          </p>
          <table className="mt-2 min-w-full text-left text-sm">
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
                  <td className="py-2 pr-3">${pago.monto}</td>
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
      ) : null}
    </section>
  );
}
