import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  migrateAllPendingAction,
  migrateWpBodaAction,
  rehostWpBodaAction,
} from "@/lib/admin/actions/migration";
import { listWpBodas, previewBoda, wpTablesAvailable } from "@/lib/wp-import";
import { openWpConnection } from "@/lib/wp-import/connection";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import { prisma } from "@/lib/db/prisma";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    preview?: string;
  }>;
}

export default async function AdminMigracionPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { q, status, preview } = await searchParams;
  const statusFilter =
    status === "pendiente" || status === "migrada" ? status : "all";

  let wpReady = false;
  try {
    const conn = await openWpConnection();
    try {
      wpReady = await wpTablesAvailable(conn);
    } finally {
      await conn.end();
    }
  } catch {
    wpReady = false;
  }

  const items = wpReady
    ? await listWpBodas({ q, status: statusFilter })
    : [];
  const previewId = Number(preview ?? 0);
  const previewData =
    wpReady && previewId > 0 ? await previewBoda(previewId).catch(() => null) : null;

  const lastLogs = await prisma.adminAuditLog.findMany({
    where: {
      action: { in: ["admin.wp.migrate", "admin.wp.migrate_all", "admin.wp.rehost"] },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const pendingCount = items.filter((i) => i.status === "pendiente").length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Migración WordPress
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-stone-600">
          Copia CPT <code>boda</code> y usuarios de las tablas <code>wp_*</code> a
          las tablas Prisma de esta misma MySQL. No se modifica WordPress.
        </p>
        {!wpReady ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
            No hay tablas <code>wp_posts</code> en esta base. Cargá el dump WP
            en phpMyAdmin (puerto 8889) sobre <code>debodas_web</code>.
          </p>
        ) : (
          <p className="mt-4 text-sm text-stone-500">
            {items.length} boda{items.length === 1 ? "" : "s"}
            {statusFilter !== "all" ? ` (${statusFilter})` : ""}. Pendientes:{" "}
            {pendingCount}.
          </p>
        )}

        <form className="mt-6 flex flex-wrap gap-3" method="get">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar slug, email o pareja…"
            className="min-w-[220px] flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm"
          />
          <select
            name="status"
            defaultValue={statusFilter}
            className="min-h-11 rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
          >
            <option value="all">Todas</option>
            <option value="pendiente">Pendientes</option>
            <option value="migrada">Migradas</option>
          </select>
          <button
            type="submit"
            className="min-h-11 rounded-full bg-[#06263a] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Filtrar
          </button>
        </form>

        {wpReady && pendingCount > 0 ? (
          <AdminActionForm
            action={migrateAllPendingAction}
            className="mt-4"
            confirmMessage={`¿Migrar las ${pendingCount} bodas pendientes?`}
          >
            <AdminSubmitButton
              idleLabel={`Migrar ${pendingCount} pendientes`}
              pendingLabel="Migrando…"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            />
          </AdminActionForm>
        ) : null}
      </section>

      {previewData ? (
        <section className="rounded-3xl border border-[#06263a]/20 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-semibold text-stone-800">
            Vista previa #{previewData.wpPostId} · {previewData.slug}
          </h3>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div>Email: {previewData.email}</div>
            <div>Plan: {previewData.plan}</div>
            <div>Tema: {previewData.theme}</div>
            <div>Regalos: {previewData.gifts}</div>
            <div>Fotos: {previewData.pictures} (hint {previewData.albumHint})</div>
            <div>Invitados: {previewData.guests}</div>
            <div>Regalos confirmados: {previewData.confirmedGifts}</div>
            <div>Invitaciones: {previewData.invitations}</div>
            <div>Abonar tarjeta: {previewData.hasAbonar ? `sí (${previewData.abonarPagos})` : "no"}</div>
          </dl>
          {previewData.warnings.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
              {previewData.warnings.map((w) => (
                <li key={w.code}>{w.message}</li>
              ))}
            </ul>
          ) : null}
          <AdminActionForm action={migrateWpBodaAction} className="mt-4">
            <input type="hidden" name="wp_post_id" value={previewData.wpPostId} />
            <input type="hidden" name="overwrite" value="1" />
            <AdminSubmitButton
              idleLabel="Migrar / re-migrar esta boda"
              pendingLabel="Migrando…"
              className="rounded-full bg-[#06263a] px-4 py-2 text-sm font-semibold text-white"
            />
          </AdminActionForm>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Pareja</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fotos / regalos / RSVP</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.wpPostId} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {item.slug}
                  </td>
                  <td className="px-4 py-3">{item.coupleLabel}</td>
                  <td className="px-4 py-3 text-stone-600">{item.email}</td>
                  <td className="px-4 py-3">{item.plan}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.status === "migrada"
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-amber-50 text-amber-900"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {item.pictureCount}/{item.giftCount}/{item.guestCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/migracion?preview=${item.wpPostId}&status=${statusFilter}&q=${encodeURIComponent(q ?? "")}`}
                        className="text-xs font-semibold text-[#06263a] hover:underline"
                      >
                        Vista previa
                      </Link>
                      <AdminActionForm action={migrateWpBodaAction}>
                        <input type="hidden" name="wp_post_id" value={item.wpPostId} />
                        <input
                          type="hidden"
                          name="overwrite"
                          value={item.status === "migrada" ? "1" : "0"}
                        />
                        <AdminSubmitButton
                          idleLabel={item.status === "migrada" ? "Re-migrar" : "Migrar"}
                          pendingLabel="…"
                          className="text-xs font-semibold text-[#06263a] hover:underline"
                        />
                      </AdminActionForm>
                      {item.prismaSlug ? (
                        <Link
                          href={`/bodas/${item.prismaSlug}`}
                          target="_blank"
                          className="text-xs font-semibold text-stone-600 hover:underline"
                        >
                          Ver sitio
                        </Link>
                      ) : null}
                      {item.prismaBodaId ? (
                        <AdminActionForm
                          action={rehostWpBodaAction}
                          confirmMessage="¿Copiar fotos WP a /uploads de esta boda?"
                        >
                          <input type="hidden" name="boda_id" value={item.prismaBodaId} />
                          <AdminSubmitButton
                            idleLabel="Rehost fotos"
                            pendingLabel="…"
                            className="text-xs font-semibold text-stone-600 hover:underline"
                          />
                        </AdminActionForm>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && wpReady ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                    No hay bodas WP con ese filtro.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-lg font-semibold text-stone-800">Últimas corridas</h3>
        {lastLogs.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Todavía no hay migraciones.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-stone-600">
            {lastLogs.map((log) => (
              <li key={log.id}>
                {log.createdAt.toISOString().slice(0, 16).replace("T", " ")} ·{" "}
                {log.actorEmail} · {log.action}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
