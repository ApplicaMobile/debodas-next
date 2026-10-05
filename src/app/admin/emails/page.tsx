import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { IllustrationEnvelope } from "@/components/account/AccountIllustrations";
import {
  AccountFilterBar,
  AccountPageBody,
  AccountPageHeader,
  AccountRowActions,
  AccountSection,
  AccountStatCard,
  AccountTable,
  accountTableHeadClass,
  accountTableRowClass,
  accountTableTdClass,
  accountTableThClass,
} from "@/components/account/AccountPage";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import {
  Alert,
  Badge,
  IconEye,
  IconLink,
  IconMailResend,
  IconSubmitButton,
  IconTrash,
  Input,
  Select,
} from "@/components/ui";
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

  const hasFilters = Boolean(query || status || type);

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/emails"
        area="Panel admin"
        section="Operación"
        title="Emails"
        description={`Historial de envíos (${total}), cola y reintentos.`}
        meta={
          <span className="flex flex-wrap items-center gap-2 type-body-sm text-text-secondary">
            Estado del proveedor SMTP:
            <Badge tone={configured ? "aprobado" : "pendiente"}>
              {configured ? "configurado" : "simulado (sin credenciales)"}
            </Badge>
          </span>
        }
        actions={
          <>
            <AdminActionForm
              action={retryFailedEmailsAdminAction}
              confirmMessage="¿Agregar a la cola todos los emails fallidos o bloqueados que puedan reintentarse?"
            >
              <AdminSubmitButton
                idleLabel="Reintentar todos los fallidos"
                pendingLabel="Agregando…"
                variant="secundario"
              />
            </AdminActionForm>
            <AdminActionForm action={processEmailQueueAdminAction}>
              <AdminSubmitButton
                idleLabel="Procesar cola ahora"
                pendingLabel="Procesando…"
                variant="primario"
              />
            </AdminActionForm>
          </>
        }
      />

      {params.ok === "processed" ? (
        <Alert tone="exito" title="Cola procesada">
          {params.claimed ?? "0"} reclamados, {params.sent ?? "0"} enviados y{" "}
          {params.failed ?? "0"} con error.
        </Alert>
      ) : params.ok === "requeued" ? (
        <Alert
          tone="info"
          title={`${params.count ?? "0"} emails agregados nuevamente a la cola.`}
        />
      ) : null}

      <section aria-label="Resumen de envíos">
        <ul className="grid gap-4 sm:grid-cols-3">
          <AccountStatCard
            iconHref="/admin/emails"
            label="En cola"
            value={pendingCount}
            detail="queued · processing · retry"
          />
          <AccountStatCard
            iconHref="/admin/emails"
            label="Enviados"
            value={sentCount}
            detail="sent"
          />
          <AccountStatCard
            iconHref="/admin/emails"
            label="Con problemas"
            value={problemCount}
            detail={problemCount > 0 ? "failed · blocked — revisalos abajo" : "failed · blocked"}
            highlight={problemCount > 0}
          />
        </ul>
      </section>

      <AccountSection
        id="admin-emails-historial"
        title="Historial"
        description="Filtrá por destinatario, asunto, estado o tipo. Reintentar y eliminar piden confirmación."
      >
        <AccountFilterBar
          label="Filtrar emails"
          clearHref="/admin/emails"
          showClear={hasFilters}
        >
          <Input
            id="email-search"
            type="search"
            name="q"
            label="Buscar por destinatario o asunto"
            defaultValue={query}
            placeholder="Buscar destinatario o asunto…"
            className="lg:flex-[2]"
          />
          <Select
            id="email-status"
            name="status"
            label="Estado"
            defaultValue={status}
            options={[
              { value: "", label: "Todos los estados" },
              ...EMAIL_STATUSES.map((value) => ({ value, label: value })),
            ]}
          />
          <Select
            id="email-type"
            name="type"
            label="Tipo"
            defaultValue={type}
            options={[
              { value: "", label: "Todos los tipos" },
              ...typeGroups.map((group) => ({
                value: group.type,
                label: `${group.type} (${group._count._all})`,
              })),
            ]}
          />
        </AccountFilterBar>

        <div className="mt-6">
          {logs.length === 0 ? (
            <AccountEmptyState
              illustration={IllustrationEnvelope}
              title={
                hasFilters
                  ? "No hay emails con ese filtro."
                  : "Todavía no hay emails registrados."
              }
              description={
                hasFilters
                  ? "Probá con otra búsqueda o limpiá los filtros."
                  : "Los envíos del sistema (recuperación de contraseña, avisos, calificaciones) van a aparecer acá."
              }
              actions={
                hasFilters
                  ? [{ label: "Limpiar filtros", href: "/admin/emails" }]
                  : undefined
              }
            />
          ) : (
            <AccountTable caption="Historial de emails" tableClassName="min-[769px]:min-w-[860px]">
              <thead className={accountTableHeadClass}>
                <tr>
                  <th scope="col" className={accountTableThClass}>Fecha</th>
                  <th scope="col" className={accountTableThClass}>Para</th>
                  <th scope="col" className={accountTableThClass}>Asunto</th>
                  <th scope="col" className={accountTableThClass}>Intentos</th>
                  <th scope="col" className={accountTableThClass}>Estado</th>
                  <th scope="col" className={accountTableThClass}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className={accountTableRowClass}>
                    <td className={`${accountTableTdClass} whitespace-nowrap text-text-secondary`} data-primary="">
                      {log.createdAt.toLocaleString("es-AR")}
                    </td>
                    <td className={`${accountTableTdClass} break-all`} data-label="Para">
                      {log.toAddress}
                    </td>
                    <td className={accountTableTdClass} data-label="Asunto">
                      <span className="font-semibold">{log.subject}</span>
                      {log.error ? (
                        <p className="mt-1 type-caption text-status-error-fg">
                          {log.error}
                        </p>
                      ) : null}
                      {["queued", "retry"].includes(log.status) ? (
                        <p className="mt-1 type-caption text-text-secondary">
                          Próximo intento:{" "}
                          {log.availableAt.toLocaleString("es-AR")}
                        </p>
                      ) : null}
                    </td>
                    <td className={`${accountTableTdClass} tabular-nums text-text-secondary`} data-label="Intentos">
                      {log.attempts}/{log.maxAttempts}
                    </td>
                    <td className={accountTableTdClass} data-label="Estado">
                      <AdminStatusBadge kind="email" status={log.status} />
                    </td>
                    <td className={accountTableTdClass} data-label="Acción" data-actions="">
                      <AccountRowActions>
                        <IconLink
                          href={`/admin/emails/${log.id}`}
                          label={`Ver el email a ${log.toAddress}`}
                          tooltip="Ver"
                          icon={<IconEye />}
                        />
                        {["failed", "blocked"].includes(log.status) &&
                        log.contentEncrypted ? (
                          <AdminActionForm
                            action={retryEmailAdminAction}
                            confirmMessage="¿Agregar nuevamente este email a la cola?"
                          >
                            <input type="hidden" name="email_id" value={log.id} />
                            <IconSubmitButton
                              label="Reintentar"
                              pendingLabel="Agregando…"
                              icon={<IconMailResend />}
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
                            <IconSubmitButton
                              label="Eliminar"
                              pendingLabel="Eliminando…"
                              icon={<IconTrash />}
                              variant="danger"
                            />
                          </AdminActionForm>
                        ) : null}
                      </AccountRowActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AccountTable>
          )}
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
        </div>
      </AccountSection>
    </AccountPageBody>
  );
}
