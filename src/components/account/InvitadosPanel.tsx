"use client";

import { useActionState } from "react";
import {
  addRsvpGuestAction,
  deleteRsvpGuestAction,
  updateRsvpStatusAction,
} from "@/lib/account/actions/content";
import type { FormState } from "@/lib/account/form-state";
import { FormAlert } from "@/components/account/FormAlert";

interface InvitadosPanelProps {
  guests: Array<{
    id: string;
    name: string;
    email: string | null;
    status: string;
    notes: string | null;
  }>;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  declined: "No asiste",
};

const initialState: FormState = {};

export function InvitadosPanel({ guests }: InvitadosPanelProps) {
  const [addState, addAction, addPending] = useActionState(
    addRsvpGuestAction,
    initialState,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-800">
          Lista de invitados
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-stone-500">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-stone-500">
                    No hay invitados cargados.
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr key={guest.id} className="border-b border-stone-50">
                    <td className="py-3 pr-4 font-medium text-stone-800">
                      {guest.name}
                    </td>
                    <td className="py-3 pr-4 text-stone-600">
                      {guest.email ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <form action={updateRsvpStatusAction} className="inline">
                        <input type="hidden" name="guest_id" value={guest.id} />
                        <select
                          name="status"
                          defaultValue={guest.status}
                          className="rounded-lg border border-stone-200 px-2 py-1 text-xs"
                          onChange={(event) =>
                            event.currentTarget.form?.requestSubmit()
                          }
                        >
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmado</option>
                          <option value="declined">No asiste</option>
                        </select>
                      </form>
                    </td>
                    <td className="py-3">
                      <form action={deleteRsvpGuestAction} className="inline">
                        <input type="hidden" name="guest_id" value={guest.id} />
                        <button
                          type="submit"
                          className="text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-800">
          Agregar invitado
        </h3>
        <form action={addAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            required
            className="rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Nombre"
          />
          <input
            name="email"
            type="email"
            className="rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Email (opcional)"
          />
          <select
            name="status"
            defaultValue="pending"
            className="rounded-xl border border-stone-200 px-4 py-3"
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            name="notes"
            className="rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Notas (opcional)"
          />
          <div className="sm:col-span-2">
            <FormAlert error={addState.error} success={addState.success} />
            <button
              type="submit"
              disabled={addPending}
              className="mt-2 rounded-full bg-[#556B2F] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {addPending ? "Agregando…" : "Agregar invitado"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
