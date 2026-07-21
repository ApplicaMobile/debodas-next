import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { isEmailConfigured } from "@/lib/email/client";
import { prisma } from "@/lib/db/prisma";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import {
  deleteEmailLogAdminAction,
  processEmailQueueAdminAction,
  retryFailedEmailsAdminAction,
  retryEmailAdminAction,
} from "@/lib/admin/actions";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 25;
const EMAIL_STATUSES = [
  "queued",
  "processing",
  "retry",
  "sent",
  "failed",
  "blocked",
  "skipped",
  "cancelled",
] as const;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    type?: string;
    ok?: string;
    claimed?: string;
    sent?: string;
    failed?: string;
    count?: string;
  }>;
}

export default async function AdminEmailsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const status = EMAIL_STATUSES.includes(
    params.status as (typeof EMAIL_STATUSES)[number],
  )
    ? params.status
    : "";
  const type = (params.type ?? "").trim();
  const where: Prisma.EmailLogWhereInput = {
    ...(query
      ? {
          OR: [
            { toAddress: { contains: query } },
            { subject: { contains: query } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
  };

  const configured = isEmailConfigured();
  const [total, statusGroups, typeGroups] = await Promise.all([
    prisma.emailLog.count({ where }),
    prisma.emailLog.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.emailLog.groupBy({
      by: ["type"],
      _count: { _all: true },
      orderBy: { type: "asc" },
    }),
  ]);
  const statusCounts = new Map(
    statusGroups.map((group) => [group.status, group._count._all]),
  );
  const pendingCount =
    (statusCounts.get("queued") ?? 0) +
    (statusCounts.get("processing") ?? 0) +
    (statusCounts.get("retry") ?? 0);
  const problemCount =
    (statusCounts.get("failed") ?? 0) + (statusCounts.get("blocked") ?? 0);
  const sentCount = statusCounts.get("sent") ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Math.min(
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    totalPages,
  );
  const logs = await prisma.emailLog.findMany({
    where,
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
        {params.ok === "processed" ? (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Cola procesada: {params.claimed ?? "0"} reclamados,{" "}
            {params.sent ?? "0"} enviados y {params.failed ?? "0"} con error.
          </p>
        ) : params.ok === "requeued" ? (
          <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {params.count ?? "0"} emails agregados nuevamente a la cola.
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <AdminActionForm action={processEmailQueueAdminAction}>
            <AdminSubmitButton
              idleLabel="Procesar cola ahora"
              pendingLabel="Procesando…"
              className="rounded-full bg-[#06263a] px-4 py-2.5 text-sm font-semibold text-white"
            />
          </AdminActionForm>
          <AdminActionForm
            action={retryFailedEmailsAdminAction}
            confirmMessage="¿Agregar a la cola todos los emails fallidos o bloqueados que puedan reintentarse?"
          >
            <AdminSubmitButton
              idleLabel="Reintentar todos los fallidos"
              pendingLabel="Agregando…"
              className="rounded-full border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700"
            />
          </AdminActionForm>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "En cola", value: pendingCount, color: "text-blue-700" },
          { label: "Enviados", value: sentCount, color: "text-emerald-700" },
          { label: "Con problemas", value: problemCount, color: "text-red-700" },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {item.label}
            </p>
            <p className={`mt-2 text-3xl font-semibold ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <form className="flex flex-wrap gap-3" method="get">
          <label htmlFor="email-search" className="sr-only">
            Buscar por destinatario o asunto
          </label>
          <input
            id="email-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar destinatario o asunto…"
            className="min-h-11 min-w-[220px] flex-1 rounded-xl border border-stone-300 px-4 text-sm"
          />
          <label htmlFor="email-status" className="sr-only">
            Estado
          </label>
          <select
            id="email-status"
            name="status"
            defaultValue={status}
            className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm"
          >
            <option value="">Todos los estados</option>
            {EMAIL_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <label htmlFor="email-type" className="sr-only">
            Tipo
          </label>
          <select
            id="email-type"
            name="type"
            defaultValue={type}
            className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm"
          >
            <option value="">Todos los tipos</option>
            {typeGroups.map((group) => (
              <option key={group.type} value={group.type}>
                {group.type} ({group._count._all})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="min-h-11 rounded-full bg-stone-800 px-5 text-sm font-semibold text-white"
          >
            Filtrar
          </button>
          {query || status || type ? (
            <Link
              href="/admin/emails"
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
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/emails/${log.id}`}
                        className="text-xs font-semibold text-[#06263a] underline"
                      >
                        Ver
                      </Link>
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
                      ) : null}
                      {["failed", "blocked", "skipped", "cancelled"].includes(
                        log.status,
                      ) ? (
                        <AdminActionForm
                          action={deleteEmailLogAdminAction}
                          confirmMessage="¿Eliminar definitivamente este registro de email?"
                        >
                          <input type="hidden" name="email_id" value={log.id} />
                          <AdminSubmitButton
                            idleLabel="Eliminar"
                            pendingLabel="Eliminando…"
                            className="text-xs font-semibold text-red-700 underline"
                          />
                        </AdminActionForm>
                      ) : null}
                    </div>
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
          query={{
            ...(query ? { q: query } : {}),
            ...(status ? { status } : {}),
            ...(type ? { type } : {}),
          }}
        />
      </section>
    </div>
  );
}
