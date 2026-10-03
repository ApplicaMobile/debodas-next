import Link from "next/link";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminHealthBadge } from "@/components/admin/AdminStatusBadge";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import { Alert, Button } from "@/components/ui";
import { runMaintenanceAdminAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSystemHealthReport } from "@/lib/admin/system-health";
import { getMaintenanceRetentionConfig } from "@/lib/maintenance/config";
import { cn } from "@/lib/cn";

interface PageProps {
  searchParams: Promise<{
    ok?: string;
    rate?: string;
    emails?: string;
    audit?: string;
    tokens?: string;
  }>;
}

export default async function AdminSystemStatusPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const report = await getSystemHealthReport();
  const retention = getMaintenanceRetentionConfig();

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/estado"
        area="Panel admin"
        section="Sistema"
        title="Estado del sistema"
        description="Salud de MariaDB, SMTP, cola, crons, storage y MercadoPago."
        meta={
          <>
            <AdminHealthBadge level={report.overall} />
            <span className="type-caption text-text-secondary">
              Última lectura:{" "}
              {report.checkedAt.toLocaleString("es-AR", {
                dateStyle: "short",
                timeStyle: "medium",
              })}
            </span>
            <span className="type-caption text-text-secondary">
              Retención: emails {retention.emailLogDays} días · auditoría{" "}
              {retention.auditLogDays} días.
            </span>
          </>
        }
        actions={
          <AdminActionForm
            action={runMaintenanceAdminAction}
            confirmMessage="¿Ejecutar limpieza de rate limits, emails viejos, auditoría y tokens vencidos?"
          >
            <AdminSubmitButton
              idleLabel="Ejecutar mantenimiento ahora"
              pendingLabel="Limpiando…"
              variant="primario"
              size="md"
            />
          </AdminActionForm>
        }
      />

      {params.ok === "maintenance" ? (
        <Alert tone="exito" title="Mantenimiento ejecutado">
          {params.rate ?? "0"} rate limits, {params.emails ?? "0"} emails,{" "}
          {params.audit ?? "0"} auditoría, {params.tokens ?? "0"} tokens.
        </Alert>
      ) : null}

      {report.alerts.length > 0 ? (
        <section aria-label="Alertas del sistema" className="space-y-3">
          {report.alerts.map((alert) => (
            <Alert
              key={alert.id}
              tone={alert.level === "error" ? "error" : "pendiente"}
              title={alert.message}
              action={
                alert.href ? (
                  <Button href={alert.href} variant="fantasma" size="sm">
                    Ver detalle
                  </Button>
                ) : undefined
              }
            />
          ))}
        </section>
      ) : (
        <Alert tone="exito" title="Sin alertas activas." />
      )}

      <section aria-label="Chequeos del sistema">
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {report.checks.map((check) => {
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="type-h4 text-text-primary">{check.label}</h3>
                  <AdminHealthBadge level={check.level} className="shrink-0" />
                </div>
                <p className="mt-3 type-body-sm font-medium text-text-primary">
                  {check.summary}
                </p>
                {check.detail ? (
                  <p className="mt-2 type-body-sm text-text-secondary">
                    {check.detail}
                  </p>
                ) : null}
                {check.href ? (
                  <p className="mt-3 type-button-sm text-text-link">
                    Ver detalle <span aria-hidden="true">→</span>
                  </p>
                ) : null}
              </>
            );
            const boxClass =
              "block h-full rounded-md bg-surface-default p-4 shadow-elevation-1 sm:p-5";

            return (
              <li key={check.id}>
                {check.href ? (
                  <Link
                    href={check.href}
                    className={cn(
                      boxClass,
                      "focus-ring transition-shadow hover:shadow-elevation-2 motion-reduce:transition-none",
                    )}
                  >
                    {body}
                  </Link>
                ) : (
                  <article className={boxClass}>{body}</article>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </AccountPageBody>
  );
}
