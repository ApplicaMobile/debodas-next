import { requireAdmin } from "@/lib/admin/require-admin";
import { isEmailConfigured } from "@/lib/email/client";
import { prisma } from "@/lib/db/prisma";

export default async function AdminEmailsPage() {
  await requireAdmin();

  const configured = isEmailConfigured();
  const logs = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Emails
        </h2>
        <p className="mt-2 text-stone-600">
          Historial de envíos (Resend). Estado del proveedor:{" "}
          <strong className={configured ? "text-emerald-700" : "text-amber-700"}>
            {configured ? "RESEND_API_KEY configurada" : "simulado (sin API key)"}
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
                <th className="px-4 py-3">Estado</th>
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
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                        log.status === "sent"
                          ? "bg-emerald-50 text-emerald-700"
                          : log.status === "skipped"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {log.status === "skipped" ? "simulado" : log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-stone-500"
                  >
                    Todavía no hay emails registrados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
