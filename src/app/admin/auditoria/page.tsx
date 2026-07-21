import Link from "next/link";
import type { Prisma } from "@prisma/client";
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

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Auditoría administrativa
        </h2>
        <p className="mt-2 text-stone-600">
          {total} acción{total === 1 ? "" : "es"} registrada
          {total === 1 ? "" : "s"}.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <form className="flex flex-wrap gap-3" method="get">
          <label htmlFor="audit-search" className="sr-only">
            Buscar administrador o entidad
          </label>
          <input
            id="audit-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Administrador o ID de entidad…"
            className="min-h-11 min-w-[220px] flex-1 rounded-xl border border-stone-300 px-4 text-sm"
          />
          <label htmlFor="audit-action" className="sr-only">
            Acción
          </label>
          <select
            id="audit-action"
            name="action"
            defaultValue={action}
            className="min-h-11 max-w-xs rounded-xl border border-stone-300 px-3 text-sm"
          >
            <option value="">Todas las acciones</option>
            {actionGroups.map((group) => (
              <option key={group.action} value={group.action}>
                {auditActionLabel(group.action)} ({group._count._all})
              </option>
            ))}
          </select>
          <label htmlFor="audit-entity" className="sr-only">
            Entidad
          </label>
          <select
            id="audit-entity"
            name="entity"
            defaultValue={entity}
            className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm"
          >
            <option value="">Todas las entidades</option>
            {entityGroups.map((group) => (
              <option key={group.entity} value={group.entity}>
                {auditEntityLabel(group.entity)} ({group._count._all})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="min-h-11 rounded-full bg-stone-800 px-5 text-sm font-semibold text-white"
          >
            Filtrar
          </button>
          {query || action || entity ? (
            <Link
              href="/admin/auditoria"
              className="inline-flex min-h-11 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-700"
            >
              Limpiar
            </Link>
          ) : null}
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Administrador</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Entidad</th>
                <th className="px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {logs.map((log) => (
                <tr key={log.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-stone-500">
                    {log.createdAt.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {log.actorEmail}
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {auditActionLabel(log.action)}
                    <span className="mt-1 block text-xs font-normal text-stone-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {auditEntityLabel(log.entity)}
                    {log.entityId ? (
                      <span className="block max-w-48 truncate text-xs text-stone-400">
                        {log.entityId}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <code className="block max-w-md whitespace-pre-wrap break-words text-xs text-stone-600">
                      {JSON.stringify(log.metadata)}
                    </code>
                  </td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-stone-500"
                  >
                    Todavía no hay acciones administrativas registradas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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
      </section>
    </div>
  );
}
