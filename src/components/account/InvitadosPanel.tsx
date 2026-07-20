"use client";

import { useActionState } from "react";
import {
  addRsvpGuestAction,
  deleteRsvpGuestAction,
  updateRsvpStatusAction,
} from "@/lib/account/actions/content";
import type { FormState } from "@/lib/account/form-state";
import { FormAlert } from "@/components/account/FormAlert";
import { ConfirmDeleteForm } from "@/components/account/ConfirmDeleteForm";
import { PlanUsageMeter } from "@/components/account/PlanUsageMeter";
import {
  canAddRsvpGuest,
  getPlanLimits,
  rsvpLimitMessage,
} from "@/lib/plans/limits";
import {
  canChooseRsvpMenu,
  RSVP_MENU_OPTIONS,
  rsvpMenuLabel,
} from "@/lib/rsvp/menu";

interface InvitadosPanelProps {
  plan: string;
  guests: Array<{
    id: string;
    name: string;
    email: string | null;
    status: string;
    menu: string;
    notes: string | null;
  }>;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  declined: "No asiste",
};

const initialState: FormState = {};

export function InvitadosPanel({ plan, guests }: InvitadosPanelProps) {
  const limits = getPlanLimits(plan);
  const atGuestLimit = !canAddRsvpGuest(plan, guests.length);
  const menuEnabled = canChooseRsvpMenu(plan);

  const [addState, addAction, addPending] = useActionState(
    addRsvpGuestAction,
    initialState,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold text-stone-800">
            Lista de invitados
          </h3>
        </div>
        <PlanUsageMeter
          label="invitados"
          current={guests.length}
          max={limits.maxRsvpGuests}
        />
        {limits.maxRsvpGuests !== null ? (
          <p className="mt-1 text-xs text-stone-500">{rsvpLimitMessage(plan)}</p>
        ) : null}
        {guests.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center">
            <p className="font-medium text-stone-700">
              Todavía no hay invitados
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Cargalos manualmente o esperá las confirmaciones del micrositio.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-stone-500">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Menú</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id} className="border-b border-stone-50">
                    <td className="py-3 pr-4 font-medium text-stone-800">
                      {guest.name}
                    </td>
                    <td className="py-3 pr-4 text-stone-600">
                      {guest.email ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-stone-600">
                      {rsvpMenuLabel(guest.menu)}
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
                      <ConfirmDeleteForm
                        action={deleteRsvpGuestAction}
                        message="¿Eliminar este invitado?"
                        className="inline"
                      >
                        <input type="hidden" name="guest_id" value={guest.id} />
                        <button
                          type="submit"
                          className="text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </ConfirmDeleteForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h3 className="text-lg font-semibold text-stone-800">
          Agregar invitado
        </h3>
        <form action={addAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            required
            className="rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Nombre"
            disabled={atGuestLimit}
          />
          <input
            name="email"
            type="email"
            className="rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Email (opcional)"
            disabled={atGuestLimit}
          />
          <select
            name="status"
            defaultValue="pending"
            className="rounded-xl border border-stone-200 px-4 py-3"
            disabled={atGuestLimit}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {menuEnabled ? (
            <select
              name="menu"
              defaultValue="general"
              className="rounded-xl border border-stone-200 px-4 py-3"
              disabled={atGuestLimit}
            >
              {RSVP_MENU_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input type="hidden" name="menu" value="general" />
          )}
          <input
            name="notes"
            className="rounded-xl border border-stone-200 px-4 py-3 sm:col-span-2"
            placeholder="Notas (opcional)"
            disabled={atGuestLimit}
          />
          <div className="sm:col-span-2">
            <FormAlert error={addState.error} success={addState.success} />
            <button
              type="submit"
              disabled={addPending || atGuestLimit}
              className="mt-2 rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-60"
            >
              {atGuestLimit
                ? "Límite de invitados alcanzado"
                : addPending
                  ? "Agregando…"
                  : "Agregar invitado"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
