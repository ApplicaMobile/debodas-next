import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { updateUserRoleAction } from "@/lib/admin/actions";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { IllustrationGuests } from "@/components/account/AccountIllustrations";
import {
  AccountFilterBar,
  AccountPageBody,
  AccountPageHeader,
  AccountSection,
  AccountTable,
  accountCompactControlClass,
  accountTableHeadClass,
  accountTableRowClass,
  accountTableTdClass,
  accountTableThClass,
} from "@/components/account/AccountPage";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminAccountStatusForm } from "@/components/admin/AdminAccountStatusForm";
import {
  AdminAccountStatusBadge,
  AdminPlanBadge,
} from "@/components/admin/AdminStatusBadge";
import { Alert, Badge, IconCheck, IconSubmitButton, Input, Select } from "@/components/ui";
import { normalizeAccountStatus } from "@/lib/account/status";

/** Filtro de estado: por defecto se ocultan las eliminadas. */
const STATUS_FILTERS = {
  visibles: { label: "Activas y suspendidas", where: { status: { in: ["active", "suspended"] } } },
  active: { label: "Activas", where: { status: "active" } },
  suspended: { label: "Suspendidas", where: { status: "suspended" } },
  deleted: { label: "Eliminadas", where: { status: "deleted" } },
  todas: { label: "Todas", where: {} },
} satisfies Record<string, { label: string; where: Prisma.UserWhereInput }>;

type StatusFilterKey = keyof typeof STATUS_FILTERS;

function parseStatusFilter(value: string | undefined): StatusFilterKey {
  return value && value in STATUS_FILTERS ? (value as StatusFilterKey) : "visibles";
}

const STATUS_FLASH: Record<string, string> = {
  suspend: "Cuenta suspendida.",
  reactivate: "Cuenta reactivada.",
  delete: "Cuenta eliminada (baja lógica). Podés verla con el filtro Eliminadas.",
  restore: "Cuenta restaurada.",
};

const STATUS_ERRORS: Record<string, string> = {
  self: "No podés suspender ni eliminar tu propia cuenta.",
  last_admin: "No podés suspender ni eliminar al último administrador activo.",
  confirm_email: "Para eliminar, escribí exactamente el email de la cuenta.",
  invalid_transition: "La cuenta ya no está en un estado que permita esa acción. Recargá la página.",
  erased: "Esa cuenta fue borrada definitivamente por la pareja y no se puede modificar.",
  not_found: "No encontramos la cuenta.",
};

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{
    ok?: string;
    error?: string;
    q?: string;
    page?: string;
    estado?: string;
  }>;
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const flash = await searchParams;
  const q = (flash.q ?? "").trim();
  const estado = parseStatusFilter(flash.estado);
  const hasFilters = Boolean(q) || estado !== "visibles";
  const where: Prisma.UserWhereInput = {
    ...STATUS_FILTERS[estado].where,
    ...(q
      ? {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
            { boda: { title: { contains: q } } },
            { boda: { slug: { contains: q } } },
          ],
        }
      : {}),
  };
  const total = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number.parseInt(flash.page ?? "1", 10);
  const page = Math.min(
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    totalPages,
  );

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      boda: { select: { id: true, slug: true, title: true, plan: true } },
    },
  });

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/usuarios"
        area="Panel admin"
        section="Bodas y clientes"
        title="Usuarios"
        description="Cuentas del sistema, su rol de acceso y su estado."
        meta={
          <span className="type-body-sm tabular-nums text-text-secondary">
            {total} cuenta{total === 1 ? "" : "s"}
            {q ? ` para “${q}”` : " en el sistema"}
            {estado !== "todas" ? ` (${STATUS_FILTERS[estado].label.toLowerCase()})` : ""}.
          </span>
        }
      />

      {flash.ok ? (
        <Alert tone="exito" title={STATUS_FLASH[flash.ok] ?? "Rol actualizado."} />
      ) : null}
      {flash.error ? (
        <Alert
          tone="error"
          title={
            STATUS_ERRORS[flash.error] ??
            (flash.error === "self"
              ? "No podés quitarte el rol admin a vos mismo."
              : "No se pudo actualizar la cuenta.")
          }
        />
      ) : null}

      <AccountSection
        id="admin-usuarios-listado"
        title="Cuentas"
        description="Buscá por email, nombre o boda y filtrá por estado. Los cambios de rol y de estado piden confirmación; las eliminadas se ocultan salvo que las filtres."
      >
        <AccountFilterBar
          label="Buscar usuarios"
          submitLabel="Buscar"
          clearHref="/admin/usuarios"
          showClear={hasFilters}
        >
          <Input
            id="admin-usuarios-search"
            type="search"
            name="q"
            label="Buscar usuarios"
            defaultValue={q}
            placeholder="Buscar por email, nombre o boda…"
          />
          <Select
            id="admin-usuarios-estado"
            name="estado"
            label="Estado"
            defaultValue={estado}
            options={Object.entries(STATUS_FILTERS).map(([key, filter]) => ({
              value: key,
              label: filter.label,
            }))}
          />
        </AccountFilterBar>

        <div className="mt-6">
          {users.length === 0 ? (
            <AccountEmptyState
              illustration={IllustrationGuests}
              title={
                hasFilters
                  ? "No hay usuarios que coincidan con la búsqueda."
                  : "Sin usuarios todavía."
              }
              description={
                hasFilters
                  ? "Probá con otro email, nombre o boda, o cambiá el filtro de estado."
                  : "Las cuentas nuevas van a aparecer acá."
              }
              actions={
                hasFilters ? [{ label: "Limpiar filtros", href: "/admin/usuarios" }] : undefined
              }
            />
          ) : (
            <AccountTable caption="Usuarios, roles, estado y bodas" tableClassName="min-[769px]:min-w-[960px]">
              <thead className={accountTableHeadClass}>
                <tr>
                  <th scope="col" className={accountTableThClass}>Usuario</th>
                  <th scope="col" className={accountTableThClass}>Rol</th>
                  <th scope="col" className={accountTableThClass}>Estado</th>
                  <th scope="col" className={accountTableThClass}>Boda</th>
                  <th scope="col" className={accountTableThClass}>Alta</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const status = normalizeAccountStatus(user.status);
                  return (
                  <tr key={user.id} className={accountTableRowClass}>
                    <td className={accountTableTdClass} data-primary="">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        {user.name || "—"}
                        {user.id === admin.id ? (
                          <Badge tone="info" icon={false}>
                            vos
                          </Badge>
                        ) : null}
                      </p>
                      <p className="break-all type-caption text-text-secondary">
                        {user.email}
                      </p>
                    </td>
                    <td className={accountTableTdClass} data-label="Rol">
                      <AdminActionForm
                        action={updateUserRoleAction}
                        className="flex max-w-full items-center gap-2"
                        confirmMessage={`¿Confirmás el cambio de rol de ${user.email}?`}
                      >
                        <input type="hidden" name="user_id" value={user.id} />
                        <input type="hidden" name="q" value={q} />
                        <input type="hidden" name="page" value={page} />
                        <label htmlFor={`role-${user.id}`} className="sr-only">
                          Rol de {user.email}
                        </label>
                        <select
                          id={`role-${user.id}`}
                          name="role"
                          defaultValue={user.role}
                          className={`${accountCompactControlClass} min-[769px]:min-w-[7rem]`}
                        >
                          <option value="couple">couple</option>
                          <option value="admin">admin</option>
                        </select>
                        <IconSubmitButton
                          label="Guardar"
                          pendingLabel="Guardando…"
                          icon={<IconCheck />}
                        />
                      </AdminActionForm>
                    </td>
                    <td className={accountTableTdClass} data-label="Estado">
                      <div className="w-full space-y-2 min-[769px]:w-64">
                        <AdminAccountStatusBadge status={status} />
                        {user.statusReason && status !== "active" ? (
                          <p className="break-words type-caption text-text-secondary">
                            Motivo: {user.statusReason}
                          </p>
                        ) : null}
                        {user.statusChangedAt && status !== "active" ? (
                          <p className="type-caption text-text-tertiary">
                            Desde {user.statusChangedAt.toLocaleDateString("es-AR")}
                          </p>
                        ) : null}
                        <AdminAccountStatusForm
                          userId={user.id}
                          email={user.email}
                          status={status}
                          erased={Boolean(user.erasedAt)}
                          isSelf={user.id === admin.id}
                          returnTo="/admin/usuarios"
                          q={q}
                          page={page}
                          estado={estado}
                          compact
                        />
                      </div>
                    </td>
                    <td className={accountTableTdClass} data-label="Boda">
                      {user.boda ? (
                        <span className="flex max-w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                          <Link
                            href={`/admin/bodas/${user.boda.id}`}
                            className="focus-ring rounded-sm font-semibold text-text-link hover:underline"
                          >
                            {user.boda.title}
                          </Link>
                          <AdminPlanBadge plan={user.boda.plan} />
                        </span>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className={`${accountTableTdClass} whitespace-nowrap text-text-secondary`} data-label="Alta">
                      {user.createdAt.toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </AccountTable>
          )}
          <AdminPagination
            pathname="/admin/usuarios"
            currentPage={page}
            totalPages={totalPages}
            query={{
              ...(q ? { q } : {}),
              ...(estado !== "visibles" ? { estado } : {}),
            }}
          />
        </div>
      </AccountSection>
    </AccountPageBody>
  );
}
