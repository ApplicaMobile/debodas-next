import type { Prisma } from "@prisma/client";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { IllustrationLedger } from "@/components/account/AccountIllustrations";
import {
  AccountFilterBar,
  AccountPageBody,
  AccountPageHeader,
  AccountSection,
  AccountTable,
  accountTableHeadClass,
  accountTableRowClass,
  accountTableTdClass,
  accountTableThClass,
} from "@/components/account/AccountPage";
import { Input, Select } from "@/components/ui";
import { AdminPagination } from "@/components/admin/AdminPagination";
import {
  auditActionLabel,
  auditEntityLabel,
} from "@/lib/admin/audit-labels";
import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db/prisma";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    action?: string;
    entity?: string;
  }>;
}

export default async function AdminAuditPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const action = (params.action ?? "").trim();
  const entity = (params.entity ?? "").trim();
  const where: Prisma.AdminAuditLogWhereInput = {
    ...(query
      ? {
          OR: [
            { actorEmail: { contains: query } },
            { entityId: { contains: query } },
          ],
        }
      : {}),
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
  };
  const [total, actionGroups, entityGroups] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.groupBy({
      by: ["action"],
      _count: { _all: true },
      orderBy: { action: "asc" },
    }),
    prisma.adminAuditLog.groupBy({
      by: ["entity"],
      _count: { _all: true },
      orderBy: { entity: "asc" },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Math.min(
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    totalPages,
  );
  const logs = await prisma.adminAuditLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const hasFilters = Boolean(query || action || entity);

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/auditoria"
        area="Panel admin"
        section="Operación"
        title="Auditoría administrativa"
        description="Registro de las acciones hechas desde el panel admin."
        meta={
          <span className="type-body-sm tabular-nums text-text-secondary">
            {total} acción{total === 1 ? "" : "es"} registrada
            {total === 1 ? "" : "s"}.
          </span>
        }
      />

      <AccountSection
        id="admin-auditoria-registro"
        title="Registro"
        description="Filtrá por administrador, ID de entidad, acción o tipo de entidad."
      >
        <AccountFilterBar
          label="Filtrar auditoría"
          clearHref="/admin/auditoria"
          showClear={hasFilters}
        >
          <Input
            id="audit-search"
            type="search"
            name="q"
            label="Buscar administrador o entidad"
            defaultValue={query}
            placeholder="Administrador o ID de entidad…"
            className="lg:flex-[2]"
          />
          <Select
            id="audit-action"
            name="action"
            label="Acción"
            defaultValue={action}
            options={[
              { value: "", label: "Todas las acciones" },
              ...actionGroups.map((group) => ({
                value: group.action,
                label: `${auditActionLabel(group.action)} (${group._count._all})`,
              })),
            ]}
          />
          <Select
            id="audit-entity"
            name="entity"
            label="Entidad"
            defaultValue={entity}
            options={[
              { value: "", label: "Todas las entidades" },
              ...entityGroups.map((group) => ({
                value: group.entity,
                label: `${auditEntityLabel(group.entity)} (${group._count._all})`,
              })),
            ]}
          />
        </AccountFilterBar>

        <div className="mt-6">
          {logs.length === 0 ? (
            <AccountEmptyState
              illustration={IllustrationLedger}
              title={
                hasFilters
                  ? "No hay acciones con ese filtro."
                  : "Todavía no hay acciones administrativas registradas."
              }
              description={
                hasFilters
                  ? "Probá con otra búsqueda o limpiá los filtros."
                  : "Cada cambio hecho desde el panel admin va a quedar registrado acá."
              }
              actions={
                hasFilters
                  ? [{ label: "Limpiar filtros", href: "/admin/auditoria" }]
                  : undefined
              }
            />
          ) : (
            <AccountTable caption="Acciones administrativas" tableClassName="min-w-[860px]">
              <thead className={accountTableHeadClass}>
                <tr>
                  <th scope="col" className={accountTableThClass}>Fecha</th>
                  <th scope="col" className={accountTableThClass}>Administrador</th>
                  <th scope="col" className={accountTableThClass}>Acción</th>
                  <th scope="col" className={accountTableThClass}>Entidad</th>
                  <th scope="col" className={accountTableThClass}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className={accountTableRowClass}>
                    <td className={`${accountTableTdClass} whitespace-nowrap text-text-secondary`}>
                      {log.createdAt.toLocaleString("es-AR")}
                    </td>
                    <td className={`${accountTableTdClass} break-all`}>
                      {log.actorEmail}
                    </td>
                    <td className={accountTableTdClass}>
                      <span className="font-semibold">
                        {auditActionLabel(log.action)}
                      </span>
                      <span className="mt-1 block type-caption text-text-tertiary">
                        {log.action}
                      </span>
                    </td>
                    <td className={accountTableTdClass}>
                      {auditEntityLabel(log.entity)}
                      {log.entityId ? (
                        <span className="block max-w-48 truncate type-caption text-text-tertiary">
                          {log.entityId}
                        </span>
                      ) : null}
                    </td>
                    <td className={accountTableTdClass}>
                      <code className="block max-w-md whitespace-pre-wrap break-words type-caption text-text-secondary">
                        {JSON.stringify(log.metadata)}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AccountTable>
          )}
          <AdminPagination
            pathname="/admin/auditoria"
            currentPage={page}
            totalPages={totalPages}
            query={{
              ...(query ? { q: query } : {}),
              ...(action ? { action } : {}),
              ...(entity ? { entity } : {}),
            }}
          />
        </div>
      </AccountSection>
    </AccountPageBody>
  );
}
