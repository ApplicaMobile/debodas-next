import { requireAdmin } from "@/lib/admin/require-admin";
import { isEmailConfigured } from "@/lib/email/client";
import { prisma } from "@/lib/db/prisma";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import { retryEmailAdminAction } from "@/lib/admin/actions";

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminEmailsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { page: pageRaw } = await searchParams;

  const configured = isEmailConfigured();
  const total = await prisma.emailLog.count();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number.parseInt(pageRaw ?? "1", 10);
  const page = Math.min(
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    totalPages,
  );
  const logs = await prisma.emailLog.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Emails
        </h2>
        <p className="mt-2 text-stone-600">
          Historial de envíos ({total}). Estado del proveedor SMTP:{" "}
          <strong className={configured ? "text-emerald-700" : "text-amber-700"}>
            {configured ? "configurado" : "simulado (sin credenciales)"}
          </strong>
        </p>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Para</th>
                <th className="px-4 py-3">Asunto</th>
                <th className="px-4 py-3">Intentos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {logs.map((log) => (
                <tr key={log.id} className="align-top">
                  <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                    {log.createdAt.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{log.toAddress}</td>
                  <td className="px-4 py-3 text-stone-800">
                    {log.subject}
                    {log.error ? (
                      <p className="mt-1 text-xs text-red-600">{log.error}</p>
                    ) : null}
                    {["queued", "retry"].includes(log.status) ? (
                      <p className="mt-1 text-xs text-stone-500">
                        Próximo intento:{" "}
                        {log.availableAt.toLocaleString("es-AR")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {log.attempts}/{log.maxAttempts}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                        log.status === "sent"
                          ? "bg-emerald-50 text-emerald-700"
                          : ["queued", "processing", "retry"].includes(log.status)
                            ? "bg-blue-50 text-blue-700"
                          : ["skipped", "blocked"].includes(log.status)
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {["failed", "blocked"].includes(log.status) &&
                    log.contentEncrypted ? (
                      <AdminActionForm
                        action={retryEmailAdminAction}
                        confirmMessage="¿Agregar nuevamente este email a la cola?"
                      >
                        <input type="hidden" name="email_id" value={log.id} />
                        <AdminSubmitButton
                          idleLabel="Reintentar"
                          pendingLabel="Agregando…"
                          className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700"
                        />
                      </AdminActionForm>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-stone-500"
                  >
                    Todavía no hay emails registrados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <AdminPagination
          pathname="/admin/emails"
          currentPage={page}
          totalPages={totalPages}
        />
      </section>
    </div>
  );
}
