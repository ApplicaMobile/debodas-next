"use client";

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
import { IllustrationGuests } from "@/components/account/AccountIllustrations";
import {
  AccountDeleteButton,
  AccountFilterChip,
  AccountFormActions,
  AccountSection,
  accountCompactControlClass,
  accountTableHeadClass,
  accountTableRowClass,
  accountTableTdClass,
  accountTableThClass,
  AccountPlanUsage,
} from "@/components/account/AccountPage";
import {
  FormFieldLabel,
  formControlClassName,
} from "@/components/account/FormField";
import {
  Badge,
  Button,
  Input,
  Select,
  type BadgeTone,
} from "@/components/ui";
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

const statusTones: Record<string, BadgeTone> = {
  pending: "pendiente",
  confirmed: "aprobado",
  declined: "neutro",
};

function GuestStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={statusTones[status] ?? "neutro"}>
      {statusLabels[status] ?? status}
    </Badge>
  );
}

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
        className={`${accountCompactControlClass} w-full sm:w-auto`}
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
        className={`${accountCompactControlClass} w-full min-w-0 sm:max-w-[11rem]`}
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
            className={`${accountCompactControlClass} min-w-0 flex-1`}
            aria-label="Nueva mesa"
          />
          <button
            type="submit"
            className="focus-ring min-h-9 shrink-0 rounded-sm px-2 type-button-sm text-text-accent hover:bg-surface-muted"
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
      <FormFieldLabel htmlFor="add-guest-table">Mesa</FormFieldLabel>
      <select
        id="add-guest-table"
        value={selectValue}
        disabled={disabled}
        aria-label="Mesa"
        className={`${formControlClassName} min-h-12`}
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
          aria-label="Nombre de la nueva mesa"
          className={`${formControlClassName} min-h-12`}
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
        <Button type="submit" variant="fantasma" size="sm">
          Marcar como no asiste
        </Button>
      </form>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status !== "confirmed" ? (
        <form action={statusAction}>
          <input type="hidden" name="guest_id" value={guestId} />
          <input type="hidden" name="status" value="confirmed" />
          <Button type="submit" size="sm">
            Confirmar
          </Button>
        </form>
      ) : null}
      {status !== "declined" ? (
        <form action={statusAction}>
          <input type="hidden" name="guest_id" value={guestId} />
          <input type="hidden" name="status" value="declined" />
          <Button type="submit" variant="secundario" size="sm">
            No asiste
          </Button>
        </form>
      ) : null}
      {status !== "pending" ? (
        <form action={statusAction}>
          <input type="hidden" name="guest_id" value={guestId} />
          <input type="hidden" name="status" value="pending" />
          <Button type="submit" variant="fantasma" size="sm">
            Pendiente
          </Button>
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
      <AccountDeleteButton />
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

  const filtersActive =
    statusFilter !== "all" || tableFilter !== TABLE_FILTER_ALL || Boolean(query.trim());

  return (
    <>
      <AccountSection
        id="invitados-lista"
        title="Lista de invitados"
        description="Confirmaciones que llegan desde el micrositio y los invitados que cargues a mano."
        badge={
          <Badge tone="neutro" icon={false}>
            {guests.length} {guests.length === 1 ? "invitado" : "invitados"}
          </Badge>
        }
        actions={
          guests.length > 0 ? (
            <>
              <Button type="button" variant="secundario" size="sm" onClick={exportFilteredCsv}>
                Exportar CSV
                {filteredGuests.length !== guests.length
                  ? ` (${filteredGuests.length})`
                  : ""}
              </Button>
              <Button href="#agregar-invitado" size="sm">
                Agregar invitado
              </Button>
            </>
          ) : null
        }
      >
        <AccountPlanUsage
          label="Invitados (RSVP)"
          value={guests.length}
          max={limits.maxRsvpGuests}
          unit="invitados"
          message={rsvpLimitMessage(plan)}
        />

        {guests.length > 0 ? (
          <div
            role="search"
            aria-label="Filtrar invitados"
            className="mt-6 space-y-3 rounded-md border border-border-subtle bg-surface-muted p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 type-caption font-semibold uppercase tracking-wide text-text-secondary">
                Estado
              </span>
              {RSVP_STATUS_FILTERS.map((filter) => (
                <AccountFilterChip
                  key={filter.value}
                  active={statusFilter === filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  count={statusCounts[filter.value]}
                >
                  {filter.label}
                </AccountFilterChip>
              ))}
            </div>

            {tablesEnabled ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 type-caption font-semibold uppercase tracking-wide text-text-secondary">
                  Mesa
                </span>
                <AccountFilterChip
                  active={tableFilter === TABLE_FILTER_ALL}
                  onClick={() => setTableFilter(TABLE_FILTER_ALL)}
                >
                  Todas las mesas
                </AccountFilterChip>
                <AccountFilterChip
                  active={tableFilter === TABLE_FILTER_NONE}
                  onClick={() => setTableFilter(TABLE_FILTER_NONE)}
                >
                  Sin mesa
                </AccountFilterChip>
                {knownTables.map((name) => (
                  <AccountFilterChip
                    key={name}
                    active={tableFilter === name}
                    onClick={() =>
                      setTableFilter((current) =>
                        current === name ? TABLE_FILTER_ALL : name,
                      )
                    }
                  >
                    {name}
                  </AccountFilterChip>
                ))}
              </div>
            ) : null}

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, email, mesa o notas…"
              className={`${formControlClassName} min-h-12`}
              aria-label="Buscar invitados"
            />
            <p className="type-caption text-text-secondary" aria-live="polite">
              Mostrando {filteredGuests.length} de {guests.length}
              {filtersActive ? " · filtro activo" : ""}
            </p>
          </div>
        ) : null}

        <div className="mt-4 space-y-2 empty:hidden">
          <FormAlert error={statusState.error} success={statusState.success} />
          <FormAlert error={tableState.error} success={tableState.success} />
        </div>
        {guests.length === 0 ? (
          <div className="mt-6">
            <AccountEmptyState
              illustration={IllustrationGuests}
              title="Todavía no hay invitados"
              description="Cargalos manualmente abajo o compartí el micrositio para que confirmen solos."
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
          <div className="mt-6 flex flex-col items-center rounded-md border border-dashed border-border-default bg-surface-muted px-4 py-8 text-center">
            <p className="type-label text-text-primary">
              Ningún invitado con estos filtros
            </p>
            <p className="mt-1 type-body-sm text-text-secondary">
              Probá otro estado, mesa o búsqueda.
            </p>
            <Button
              type="button"
              variant="secundario"
              size="sm"
              className="mt-4"
              onClick={() => {
                setStatusFilter("all");
                setTableFilter(TABLE_FILTER_ALL);
                setQuery("");
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <>
            <ul id="lista-invitados" role="list" className="mt-6 space-y-3 md:hidden">
              {filteredGuests.map((guest) => (
                <li
                  key={guest.id}
                  className="rounded-md border border-border-subtle bg-surface-default p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="type-label text-text-primary">{guest.name}</p>
                      <p className="mt-0.5 truncate type-body-sm text-text-secondary">
                        {guest.email ?? "Sin email"}
                      </p>
                      <div className="mt-2">
                        <GuestStatusBadge status={guest.status} />
                      </div>
                    </div>
                    <GuestDeleteButton guestId={guest.id} />
                  </div>
                  <GuestQuickActions
                    guestId={guest.id}
                    status={guest.status}
                    statusAction={statusAction}
                  />
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border-subtle pt-3 type-body-sm">
                    <div>
                      <dt className="type-caption font-semibold uppercase tracking-wide text-text-secondary">
                        Menú
                      </dt>
                      <dd className="mt-0.5 text-text-primary">
                        {rsvpMenuLabel(guest.menu)}
                      </dd>
                    </div>
                    <div>
                      <dt className="type-caption font-semibold uppercase tracking-wide text-text-secondary">
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
                        <dt className="type-caption font-semibold uppercase tracking-wide text-text-secondary">
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
                    <p className="mt-3 type-body-sm text-text-secondary">{guest.notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>

            <div className="mt-6 hidden overflow-x-auto rounded-md border border-border-subtle md:block">
              <table className="min-w-full text-left type-body-sm text-text-primary">
                <thead className={accountTableHeadClass}>
                  <tr>
                    <th className={accountTableThClass}>Nombre</th>
                    <th className={accountTableThClass}>Email</th>
                    <th className={accountTableThClass}>Menú</th>
                    {tablesEnabled ? (
                      <th className={accountTableThClass}>Mesa</th>
                    ) : null}
                    <th className={accountTableThClass}>Notas</th>
                    <th className={accountTableThClass}>Estado</th>
                    <th className={accountTableThClass}>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id} className={accountTableRowClass}>
                      <td className={`${accountTableTdClass} font-semibold`}>
                        {guest.name}
                      </td>
                      <td className={`${accountTableTdClass} text-text-secondary`}>
                        {guest.email ?? "—"}
                      </td>
                      <td className={`${accountTableTdClass} text-text-secondary`}>
                        {rsvpMenuLabel(guest.menu)}
                      </td>
                      {tablesEnabled ? (
                        <td className={`${accountTableTdClass} min-w-[11rem]`}>
                          <GuestTableField
                            key={`${guest.id}-d-${guest.tableName ?? ""}`}
                            guestId={guest.id}
                            tableName={guest.tableName}
                            knownTables={knownTables}
                            tableAction={tableAction}
                          />
                        </td>
                      ) : null}
                      <td className={`${accountTableTdClass} max-w-[12rem] truncate text-text-secondary`}>
                        {guest.notes ?? "—"}
                      </td>
                      <td className={accountTableTdClass}>
                        <GuestStatusSelect
                          guestId={guest.id}
                          status={guest.status}
                          statusAction={statusAction}
                        />
                      </td>
                      <td className={`${accountTableTdClass} text-right`}>
                        <GuestDeleteButton guestId={guest.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AccountSection>

      {tablesEnabled && guests.length > 0 ? (
        <AccountSection
          id="invitados-mesas"
          title="Resumen de mesas"
          description="Elegí una mesa del desplegable o creá una nueva con “Otra mesa…”. Tocá una tarjeta para filtrar la lista."
        >
          <ul role="list" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tableGroups.map((group) => {
              const filterValue =
                group.table === "Sin mesa" ? TABLE_FILTER_NONE : group.table;
              const active = tableFilter === filterValue;
              return (
                <li key={group.table}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setTableFilter((current) =>
                        current === filterValue ? TABLE_FILTER_ALL : filterValue,
                      )
                    }
                    className={`focus-ring h-full w-full rounded-md border p-4 text-left transition-colors motion-reduce:transition-none ${
                      active
                        ? "border-border-accent bg-surface-brand ring-2 ring-border-accent"
                        : "border-border-subtle bg-surface-muted hover:border-border-strong"
                    }`}
                  >
                    <p className="type-label text-text-primary">{group.table}</p>
                    <p className="mt-0.5 type-caption text-text-secondary">
                      {group.guests.length} invitado
                      {group.guests.length === 1 ? "" : "s"}
                    </p>
                    <ul className="mt-2 space-y-1 type-body-sm text-text-secondary">
                      {group.guests.map((guest) => (
                        <li key={guest.id} className="truncate">
                          {guest.name}
                        </li>
                      ))}
                    </ul>
                  </button>
                </li>
              );
            })}
          </ul>
        </AccountSection>
      ) : null}

      <AccountSection
        id="agregar-invitado-titulo"
        className="scroll-mt-24"
        title="Agregar invitado"
        description="Para quienes confirman por otro medio. Lo que cargues acá aparece en la lista de arriba."
      >
        <form id="agregar-invitado" action={addAction} className="scroll-mt-24">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="add-guest-name"
              label="Nombre del invitado"
              name="name"
              required
              placeholder="Nombre"
              disabled={atGuestLimit}
            />
            <Input
              id="add-guest-email"
              label="Email del invitado"
              optional
              name="email"
              type="email"
              placeholder="Email (opcional)"
              disabled={atGuestLimit}
            />
            <Select
              id="add-guest-status"
              label="Estado"
              name="status"
              defaultValue="pending"
              disabled={atGuestLimit}
              options={Object.entries(statusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            {menuEnabled ? (
              <Select
                id="add-guest-menu"
                label="Menú"
                name="menu"
                defaultValue="general"
                disabled={atGuestLimit}
                options={RSVP_MENU_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
            ) : (
              <input type="hidden" name="menu" value="general" />
            )}
            {tablesEnabled ? (
              <AddGuestTableFields
                knownTables={knownTables}
                disabled={atGuestLimit}
              />
            ) : null}
            <Input
              id="add-guest-notes"
              label="Notas"
              optional
              className="sm:col-span-2"
              name="notes"
              placeholder="Notas (opcional)"
              disabled={atGuestLimit}
            />
          </div>
          <AccountFormActions
            alert={<FormAlert error={addState.error} success={addState.success} />}
          >
            <Button
              type="submit"
              disabled={atGuestLimit}
              loading={addPending}
              loadingLabel="Agregando…"
            >
              {atGuestLimit ? "Límite de invitados alcanzado" : "Agregar invitado"}
            </Button>
          </AccountFormActions>
        </form>
      </AccountSection>

      {!tablesEnabled ? (
        <AccountSection
          id="invitados-mesas-premium"
          title="Gestión de mesas"
          badge={
            <Badge tone="premium">
              <span className="sr-only">Plan </span>Premium
            </Badge>
          }
          description="En Premium podés asignar mesas a cada invitado y ver el resumen por mesa."
        >
          <Button href="/mi-cuenta/plan" variant="secundario">
            Ver plan Premium
          </Button>
        </AccountSection>
      ) : null}
    </>
  );
}
