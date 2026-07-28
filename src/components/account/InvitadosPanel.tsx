"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  addRsvpGuestAction,
  deleteRsvpGuestAction,
  updateRsvpStatusAction,
  updateRsvpTableAction,
} from "@/lib/account/actions/content";
import type { FormState } from "@/lib/account/form-state";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
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
import {
  canManageRsvpTables,
  collectKnownTableNames,
  groupGuestsByTable,
} from "@/lib/rsvp/tables";
import {
  buildGuestsCsv,
  downloadTextFile,
  RSVP_STATUS_FILTERS,
  TABLE_FILTER_ALL,
  TABLE_FILTER_NONE,
  type RsvpStatusFilter,
} from "@/lib/rsvp/export";

interface GuestRow {
  id: string;
  name: string;
  email: string | null;
  status: string;
  menu: string;
  tableName: string | null;
  notes: string | null;
}

interface InvitadosPanelProps {
  plan: string;
  guests: GuestRow[];
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  declined: "No asiste",
};

const OTHER_TABLE = "__other__";
const initialState: FormState = {};

function GuestStatusSelect({
  guestId,
  status,
  statusAction,
}: {
  guestId: string;
  status: string;
  statusAction: (payload: FormData) => void;
}) {
  return (
    <form action={statusAction} className="inline">
      <input type="hidden" name="guest_id" value={guestId} />
      <select
        name="status"
        defaultValue={status}
        className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-xs sm:w-auto"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        aria-label="Estado del invitado"
      >
        <option value="pending">Pendiente</option>
        <option value="confirmed">Confirmado</option>
        <option value="declined">No asiste</option>
      </select>
    </form>
  );
}

function GuestTableField({
  guestId,
  tableName,
  knownTables,
  tableAction,
}: {
  guestId: string;
  tableName: string | null;
  knownTables: string[];
  tableAction: (payload: FormData) => void;
}) {
  const initialSelect = !tableName
    ? ""
    : knownTables.includes(tableName)
      ? tableName
      : OTHER_TABLE;
  const [selectValue, setSelectValue] = useState(initialSelect);
  const showOther = selectValue === OTHER_TABLE;

  return (
    <form
      action={tableAction}
      className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center"
    >
      <input type="hidden" name="guest_id" value={guestId} />
      <select
        value={selectValue}
        aria-label="Mesa del invitado"
        className="w-full min-w-0 rounded-lg border border-stone-200 px-2 py-1.5 text-xs sm:max-w-[11rem]"
        onChange={(event) => {
          const next = event.target.value;
          setSelectValue(next);
          if (next === OTHER_TABLE) return;
          const form = event.currentTarget.form;
          if (!form) return;
          const hidden = form.elements.namedItem("table_name");
          if (hidden instanceof HTMLInputElement) {
            hidden.value = next;
          }
          form.requestSubmit();
        }}
      >
        <option value="">Sin mesa</option>
        {knownTables.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value={OTHER_TABLE}>Otra mesa…</option>
      </select>
      {showOther ? (
        <div className="flex min-w-0 items-center gap-1">
          <input
            name="table_name"
            defaultValue={
              tableName && !knownTables.includes(tableName) ? tableName : ""
            }
            placeholder="Nombre de mesa"
            maxLength={60}
            required
            className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-xs"
            aria-label="Nueva mesa"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-[#6f5f47] hover:bg-stone-100"
          >
            OK
          </button>
        </div>
      ) : (
        <input type="hidden" name="table_name" value={selectValue} />
      )}
    </form>
  );
}

function AddGuestTableFields({
  knownTables,
  disabled,
}: {
  knownTables: string[];
  disabled?: boolean;
}) {
  const [selectValue, setSelectValue] = useState("");
  const showOther = selectValue === OTHER_TABLE;

  return (
    <div className="space-y-2 sm:col-span-2">
      <select
        value={selectValue}
        disabled={disabled}
        aria-label="Mesa"
        className="w-full rounded-xl border border-stone-200 px-4 py-3"
        onChange={(event) => setSelectValue(event.target.value)}
      >
        <option value="">Sin mesa</option>
        {knownTables.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value={OTHER_TABLE}>Otra mesa…</option>
      </select>
      {showOther ? (
        <input
          name="table_name"
          required
          maxLength={60}
          disabled={disabled}
          className="w-full rounded-xl border border-stone-200 px-4 py-3"
          placeholder="Nombre de la nueva mesa — ej. Mesa 1"
        />
      ) : (
        <input type="hidden" name="table_name" value={selectValue} />
      )}
    </div>
  );
}

function GuestQuickActions({
  guestId,
  status,
  statusAction,
}: {
  guestId: string;
  status: string;
  statusAction: (payload: FormData) => void;
}) {
  if (status === "confirmed") {
    return (
      <form action={statusAction} className="mt-3">
        <input type="hidden" name="guest_id" value={guestId} />
        <input type="hidden" name="status" value="declined" />
        <button
          type="submit"
          className="text-xs font-medium text-stone-500 hover:text-stone-800"
        >
          Marcar como no asiste
        </button>
      </form>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status !== "confirmed" ? (
        <form action={statusAction}>
          <input type="hidden" name="guest_id" value={guestId} />
          <input type="hidden" name="status" value="confirmed" />
          <button
            type="submit"
            className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Confirmar
          </button>
        </form>
      ) : null}
      {status !== "declined" ? (
        <form action={statusAction}>
          <input type="hidden" name="guest_id" value={guestId} />
          <input type="hidden" name="status" value="declined" />
          <button
            type="submit"
            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700"
          >
            No asiste
          </button>
        </form>
      ) : null}
      {status !== "pending" ? (
        <form action={statusAction}>
          <input type="hidden" name="guest_id" value={guestId} />
          <input type="hidden" name="status" value="pending" />
          <button
            type="submit"
            className="rounded-full px-3 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100"
          >
            Pendiente
          </button>
        </form>
      ) : null}
    </div>
  );
}

function GuestDeleteButton({ guestId }: { guestId: string }) {
  return (
    <ConfirmDeleteForm
      action={deleteRsvpGuestAction}
      message="¿Eliminar este invitado?"
      className="inline"
    >
      <input type="hidden" name="guest_id" value={guestId} />
      <button type="submit" className="text-sm text-red-600 hover:underline">
        Eliminar
      </button>
    </ConfirmDeleteForm>
  );
}

export function InvitadosPanel({ plan, guests }: InvitadosPanelProps) {
  const limits = getPlanLimits(plan);
  const atGuestLimit = !canAddRsvpGuest(plan, guests.length);
  const menuEnabled = canChooseRsvpMenu(plan);
  const tablesEnabled = canManageRsvpTables(plan);
  const knownTables = collectKnownTableNames(guests);
  const tableGroups = tablesEnabled ? groupGuestsByTable(guests) : [];

  const [statusFilter, setStatusFilter] = useState<RsvpStatusFilter>("all");
  const [tableFilter, setTableFilter] = useState(TABLE_FILTER_ALL);
  const [query, setQuery] = useState("");

  const [addState, addAction, addPending] = useActionState(
    addRsvpGuestAction,
    initialState,
  );
  const [statusState, statusAction] = useActionState(
    updateRsvpStatusAction,
    initialState,
  );
  const [tableState, tableAction] = useActionState(
    updateRsvpTableAction,
    initialState,
  );

  const statusCounts = {
    all: guests.length,
    confirmed: guests.filter((g) => g.status === "confirmed").length,
    pending: guests.filter((g) => g.status === "pending").length,
    declined: guests.filter((g) => g.status === "declined").length,
  };

  const filteredGuests = guests.filter((guest) => {
    if (statusFilter !== "all" && guest.status !== statusFilter) {
      return false;
    }
    if (tablesEnabled && tableFilter !== TABLE_FILTER_ALL) {
      if (tableFilter === TABLE_FILTER_NONE) {
        if (guest.tableName) return false;
      } else if (guest.tableName !== tableFilter) {
        return false;
      }
    }
    const q = query.trim().toLowerCase();
    if (q) {
      const haystack = [
        guest.name,
        guest.email ?? "",
        guest.notes ?? "",
        guest.tableName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  function exportFilteredCsv() {
    const csv = buildGuestsCsv(
      filteredGuests,
      (status) => statusLabels[status] ?? status,
      rsvpMenuLabel,
    );
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`invitados-${stamp}.csv`, csv);
  }

  return (
    <div className="space-y-8">
      {!tablesEnabled ? (
        <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 sm:rounded-3xl sm:p-6">
          <h3 className="text-base font-semibold text-stone-800">
            Gestión de mesas
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            En Premium podés asignar mesas a cada invitado y ver el resumen por
            mesa.
          </p>
          <Link
            href="/mi-cuenta/plan"
            className="mt-3 inline-flex rounded-full bg-[#e6dac7] px-4 py-2 text-sm font-semibold text-stone-800"
          >
            Ver plan Premium
          </Link>
        </section>
      ) : null}

      {tablesEnabled && guests.length > 0 ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
          <h3 className="text-lg font-semibold text-stone-800">
            Resumen de mesas
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Elegí una mesa del desplegable o creá una nueva con “Otra mesa…”.
            Tocá una tarjeta para filtrar la lista.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tableGroups.map((group) => {
              const filterValue =
                group.table === "Sin mesa" ? TABLE_FILTER_NONE : group.table;
              const active = tableFilter === filterValue;
              return (
                <button
                  key={group.table}
                  type="button"
                  onClick={() =>
                    setTableFilter((current) =>
                      current === filterValue ? TABLE_FILTER_ALL : filterValue,
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-sky-400 bg-sky-50 ring-2 ring-sky-200"
                      : "border-stone-100 bg-stone-50/80 hover:border-sky-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-stone-800">
                    {group.table}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {group.guests.length} invitado
                    {group.guests.length === 1 ? "" : "s"}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-stone-600">
                    {group.guests.map((guest) => (
                      <li key={guest.id} className="truncate">
                        {guest.name}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-stone-800">
            Lista de invitados
          </h3>
          {guests.length > 0 ? (
            <button
              type="button"
              onClick={exportFilteredCsv}
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Exportar CSV
              {filteredGuests.length !== guests.length
                ? ` (${filteredGuests.length})`
                : ""}
            </button>
          ) : null}
        </div>
        <PlanUsageMeter
          label="invitados"
          current={guests.length}
          max={limits.maxRsvpGuests}
        />
        {limits.maxRsvpGuests !== null ? (
          <p className="mt-1 text-xs text-stone-500">{rsvpLimitMessage(plan)}</p>
        ) : null}

        {guests.length > 0 ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {RSVP_STATUS_FILTERS.map((filter) => {
                const active = statusFilter === filter.value;
                const count = statusCounts[filter.value];
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active ? filter.activeClass : filter.idleClass
                    }`}
                  >
                    {filter.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        active ? "bg-white/25" : "bg-black/5"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {tablesEnabled ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTableFilter(TABLE_FILTER_ALL)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    tableFilter === TABLE_FILTER_ALL
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100"
                  }`}
                >
                  Todas las mesas
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter(TABLE_FILTER_NONE)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    tableFilter === TABLE_FILTER_NONE
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100"
                  }`}
                >
                  Sin mesa
                </button>
                {knownTables.map((name, index) => {
                  const palette = [
                    "border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100",
                    "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
                    "border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100",
                    "border-pink-200 bg-pink-50 text-pink-900 hover:bg-pink-100",
                  ];
                  const activePalette = [
                    "border-teal-600 bg-teal-600 text-white",
                    "border-indigo-600 bg-indigo-600 text-white",
                    "border-orange-600 bg-orange-600 text-white",
                    "border-pink-600 bg-pink-600 text-white",
                  ];
                  const i = index % palette.length;
                  const active = tableFilter === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() =>
                        setTableFilter((current) =>
                          current === name ? TABLE_FILTER_ALL : name,
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active ? activePalette[i] : palette[i]
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, email, mesa o notas…"
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm"
              aria-label="Buscar invitados"
            />
            <p className="text-xs text-stone-500">
              Mostrando {filteredGuests.length} de {guests.length}
              {statusFilter !== "all" ||
              tableFilter !== TABLE_FILTER_ALL ||
              query.trim()
                ? " · filtro activo"
                : ""}
            </p>
          </div>
        ) : null}

        <FormAlert error={statusState.error} success={statusState.success} />
        <FormAlert error={tableState.error} success={tableState.success} />
        {guests.length === 0 ? (
          <div className="mt-6">
            <AccountEmptyState
              title="Todavía no hay invitados"
              description="Cargalos manualmente abajo o compartí el micrositio para que confirmen solos."
              icon="✓"
              actions={[
                {
                  label: "Agregar primer invitado",
                  href: "#agregar-invitado",
                  primary: true,
                },
                {
                  label: "Compartir / invitar",
                  href: "/mi-cuenta/invitar",
                },
              ]}
            />
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center">
            <p className="font-medium text-stone-700">
              Ningún invitado con estos filtros
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Probá otro estado, mesa o búsqueda.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setTableFilter(TABLE_FILTER_ALL);
                setQuery("");
              }}
              className="mt-4 rounded-full bg-[#e6dac7] px-4 py-2 text-sm font-semibold text-stone-800"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <ul id="lista-invitados" className="mt-4 space-y-3 md:hidden">
              {filteredGuests.map((guest) => (
                <li
                  key={guest.id}
                  className="rounded-2xl border border-stone-100 bg-stone-50/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-800">{guest.name}</p>
                      <p className="mt-0.5 truncate text-sm text-stone-500">
                        {guest.email ?? "Sin email"}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          guest.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : guest.status === "declined"
                              ? "bg-stone-200 text-stone-700"
                              : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {statusLabels[guest.status] ?? guest.status}
                      </span>
                    </div>
                    <GuestDeleteButton guestId={guest.id} />
                  </div>
                  <GuestQuickActions
                    guestId={guest.id}
                    status={guest.status}
                    statusAction={statusAction}
                  />
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-stone-400">
                        Menú
                      </dt>
                      <dd className="mt-0.5 text-stone-700">
                        {rsvpMenuLabel(guest.menu)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-stone-400">
                        Estado
                      </dt>
                      <dd className="mt-1">
                        <GuestStatusSelect
                          guestId={guest.id}
                          status={guest.status}
                          statusAction={statusAction}
                        />
                      </dd>
                    </div>
                    {tablesEnabled ? (
                      <div className="col-span-2">
                        <dt className="text-xs uppercase tracking-wide text-stone-400">
                          Mesa
                        </dt>
                        <dd className="mt-1">
                          <GuestTableField
                            key={`${guest.id}-m-${guest.tableName ?? ""}`}
                            guestId={guest.id}
                            tableName={guest.tableName}
                            knownTables={knownTables}
                            tableAction={tableAction}
                          />
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  {guest.notes ? (
                    <p className="mt-3 text-sm text-stone-600">{guest.notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>

            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-left text-stone-500">
                    <th className="py-2 pr-4">Nombre</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Menú</th>
                    {tablesEnabled ? (
                      <th className="py-2 pr-4">Mesa</th>
                    ) : null}
                    <th className="py-2 pr-4">Notas</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => (
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
                      {tablesEnabled ? (
                        <td className="min-w-[11rem] py-3 pr-4">
                          <GuestTableField
                            key={`${guest.id}-d-${guest.tableName ?? ""}`}
                            guestId={guest.id}
                            tableName={guest.tableName}
                            knownTables={knownTables}
                            tableAction={tableAction}
                          />
                        </td>
                      ) : null}
                      <td className="max-w-[12rem] truncate py-3 pr-4 text-stone-500">
                        {guest.notes ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <GuestStatusSelect
                          guestId={guest.id}
                          status={guest.status}
                          statusAction={statusAction}
                        />
                      </td>
                      <td className="py-3">
                        <GuestDeleteButton guestId={guest.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section
        id="agregar-invitado"
        className="scroll-mt-24 rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8"
      >
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
              aria-label="Nombre del invitado"
            />
            <input
              name="email"
              type="email"
              className="rounded-xl border border-stone-200 px-4 py-3"
              placeholder="Email (opcional)"
              disabled={atGuestLimit}
              aria-label="Email del invitado"
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
          {tablesEnabled ? (
            <AddGuestTableFields
              knownTables={knownTables}
              disabled={atGuestLimit}
            />
          ) : null}
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
