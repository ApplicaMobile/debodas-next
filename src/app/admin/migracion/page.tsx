import Link from "next/link";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { IllustrationLedger } from "@/components/account/AccountIllustrations";
import {
  AccountDetailList,
  AccountFilterBar,
  AccountFormActions,
  AccountPageBody,
  AccountPageHeader,
  AccountSection,
  AccountTable,
  accountTableHeadClass,
  accountTableRowClass,
  accountTableTdClass,
  accountTableThClass,
} from "@/components/account/AccountPage";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { Alert, Input, Select } from "@/components/ui";
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

  const hasFilters = Boolean(q) || statusFilter !== "all";

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/migracion"
        area="Panel admin"
        section="Operación"
        title="Migración WordPress"
        description={
          <>
            Copia CPT <code>boda</code> y usuarios de las tablas{" "}
            <code>wp_*</code> a las tablas Prisma de esta misma MySQL. No se
            modifica WordPress.
          </>
        }
        meta={
          wpReady ? (
            <span className="type-body-sm tabular-nums text-text-secondary">
              {items.length} boda{items.length === 1 ? "" : "s"}
              {statusFilter !== "all" ? ` (${statusFilter})` : ""}. Pendientes:{" "}
              {pendingCount}.
            </span>
          ) : undefined
        }
        actions={
          wpReady && pendingCount > 0 ? (
            <AdminActionForm
              action={migrateAllPendingAction}
              confirmMessage={`¿Migrar las ${pendingCount} bodas pendientes?`}
            >
              <AdminSubmitButton
                idleLabel={`Migrar ${pendingCount} pendientes`}
                pendingLabel="Migrando…"
                variant="secundario"
              />
            </AdminActionForm>
          ) : undefined
        }
      />

      {!wpReady ? (
        <Alert
          tone="pendiente"
          title={
            <>
              No hay tablas <code>wp_posts</code> en esta base.
            </>
          }
        >
          Cargá el dump WP en phpMyAdmin (puerto 8889) sobre{" "}
          <code>debodas_web</code>.
        </Alert>
      ) : null}

      {previewData ? (
        <AccountSection
          id="admin-migracion-preview"
          title={`Vista previa #${previewData.wpPostId} · ${previewData.slug}`}
          description="Datos que se van a copiar desde WordPress."
          className="border border-border-accent"
        >
          <AccountDetailList
            columns={3}
            items={[
              { label: "Email", value: previewData.email },
              { label: "Plan", value: previewData.plan },
              { label: "Tema", value: previewData.theme },
              { label: "Regalos", value: previewData.gifts },
              {
                label: "Fotos",
                value: `${previewData.pictures} (hint ${previewData.albumHint})`,
              },
              { label: "Invitados", value: previewData.guests },
              { label: "Regalos confirmados", value: previewData.confirmedGifts },
              { label: "Invitaciones", value: previewData.invitations },
              {
                label: "Abonar tarjeta",
                value: previewData.hasAbonar
                  ? `sí (${previewData.abonarPagos})`
                  : "no",
              },
            ]}
          />
          {previewData.warnings.length > 0 ? (
            <Alert tone="pendiente" title="Advertencias" className="mt-6">
              <ul className="list-disc space-y-1 pl-5">
                {previewData.warnings.map((w) => (
                  <li key={w.code}>{w.message}</li>
                ))}
              </ul>
            </Alert>
          ) : null}
          <AccountFormActions>
            <AdminActionForm action={migrateWpBodaAction}>
              <input type="hidden" name="wp_post_id" value={previewData.wpPostId} />
              <input type="hidden" name="overwrite" value="1" />
              <AdminSubmitButton
                idleLabel="Migrar / re-migrar esta boda"
                pendingLabel="Migrando…"
                variant="primario"
                size="md"
                fullWidth
              />
            </AdminActionForm>
          </AccountFormActions>
        </AccountSection>
      ) : null}

      <AccountSection
        id="admin-migracion-listado"
        title="Bodas de WordPress"
        description="Buscá por slug, email o pareja. Abrí la vista previa antes de migrar."
      >
        <AccountFilterBar
          label="Filtrar bodas de WordPress"
          clearHref="/admin/migracion"
          showClear={hasFilters}
        >
          <Input
            id="admin-migracion-search"
            type="search"
            name="q"
            label="Buscar"
            defaultValue={q ?? ""}
            placeholder="Buscar slug, email o pareja…"
            className="lg:flex-[2]"
          />
          <Select
            id="admin-migracion-status"
            name="status"
            label="Estado"
            defaultValue={statusFilter}
            options={[
              { value: "all", label: "Todas" },
              { value: "pendiente", label: "Pendientes" },
              { value: "migrada", label: "Migradas" },
            ]}
          />
        </AccountFilterBar>

        <div className="mt-6">
          {items.length === 0 ? (
            <AccountEmptyState
              illustration={IllustrationLedger}
              title={
                wpReady
                  ? "No hay bodas WP con ese filtro."
                  : "Sin datos de WordPress."
              }
              description={
                wpReady
                  ? "Probá con otra búsqueda o cambiá el estado."
                  : "Cuando cargues el dump de WordPress, las bodas van a aparecer acá."
              }
            />
          ) : (
            <AccountTable caption="Bodas de WordPress" tableClassName="min-[769px]:min-w-[920px]">
              <thead className={accountTableHeadClass}>
                <tr>
                  <th scope="col" className={accountTableThClass}>Slug</th>
                  <th scope="col" className={accountTableThClass}>Pareja</th>
                  <th scope="col" className={accountTableThClass}>Email</th>
                  <th scope="col" className={accountTableThClass}>Plan</th>
                  <th scope="col" className={accountTableThClass}>Estado</th>
                  <th scope="col" className={accountTableThClass}>Fotos / regalos / RSVP</th>
                  <th scope="col" className={accountTableThClass}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.wpPostId} className={accountTableRowClass}>
                    <td className={`${accountTableTdClass} font-semibold`} data-primary="">
                      {item.slug}
                    </td>
                    <td className={accountTableTdClass} data-label="Pareja">{item.coupleLabel}</td>
                    <td className={`${accountTableTdClass} break-all text-text-secondary`} data-label="Email">
                      {item.email}
                    </td>
                    <td className={accountTableTdClass} data-label="Plan">{item.plan}</td>
                    <td className={accountTableTdClass} data-label="Estado">
                      <AdminStatusBadge kind="migration" status={item.status} />
                    </td>
                    <td className={`${accountTableTdClass} tabular-nums text-text-secondary`} data-label="Fotos / regalos / RSVP">
                      {item.pictureCount}/{item.giftCount}/{item.guestCount}
                    </td>
                    <td className={accountTableTdClass} data-label="Acciones" data-actions="">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link
                          href={`/admin/migracion?preview=${item.wpPostId}&status=${statusFilter}&q=${encodeURIComponent(q ?? "")}`}
                          className="focus-ring rounded-sm type-button-sm text-text-link hover:underline"
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
                            variant="secundario"
                          />
                        </AdminActionForm>
                        {item.prismaSlug ? (
                          <Link
                            href={`/bodas/${item.prismaSlug}`}
                            target="_blank"
                            className="focus-ring rounded-sm type-button-sm text-text-accent hover:underline"
                          >
                            Ver sitio
                            <span className="sr-only"> (se abre en otra pestaña)</span>
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
                              variant="fantasma"
                            />
                          </AdminActionForm>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AccountTable>
          )}
        </div>
      </AccountSection>

      <AccountSection
        id="admin-migracion-corridas"
        title="Últimas corridas"
        description="Las ocho migraciones o rehosts más recientes."
      >
        {lastLogs.length === 0 ? (
          <p className="type-body-sm text-text-secondary">
            Todavía no hay migraciones.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle rounded-md border border-border-subtle">
            {lastLogs.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 type-body-sm"
              >
                <span className="tabular-nums text-text-secondary">
                  {log.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </span>
                <span className="break-all text-text-primary">{log.actorEmail}</span>
                <code className="type-caption text-text-tertiary">{log.action}</code>
              </li>
            ))}
          </ul>
        )}
      </AccountSection>
    </AccountPageBody>
  );
}
