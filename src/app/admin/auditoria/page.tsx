import { AdminPagination } from "@/components/admin/AdminPagination";
import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db/prisma";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminAuditPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { page: pageRaw } = await searchParams;
  const total = await prisma.adminAuditLog.count();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number.parseInt(pageRaw ?? "1", 10);
  const page = Math.min(
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    totalPages,
  );
  const logs = await prisma.adminAuditLog.findMany({
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
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {log.entity}
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
        />
      </section>
    </div>
  );
}
