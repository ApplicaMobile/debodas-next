import Link from "next/link";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import { runMaintenanceAdminAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  getSystemHealthReport,
  type HealthLevel,
} from "@/lib/admin/system-health";
import { getMaintenanceRetentionConfig } from "@/lib/maintenance/config";

function levelStyles(level: HealthLevel) {
  switch (level) {
    case "ok":
      return {
        badge: "bg-emerald-50 text-emerald-800",
        label: "OK",
      };
    case "warn":
      return {
        badge: "bg-amber-50 text-amber-900",
        label: "Atención",
      };
    case "error":
      return {
        badge: "bg-red-50 text-red-800",
        label: "Error",
      };
    default:
      return {
        badge: "bg-stone-100 text-stone-600",
        label: "Sin datos",
      };
  }
}

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
  const overall = levelStyles(report.overall);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-stone-800">
              Estado del sistema
            </h2>
            <p className="mt-2 text-stone-600">
              Salud de MariaDB, SMTP, cola, crons, storage y MercadoPago.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${overall.badge}`}
          >
            {overall.label}
          </span>
        </div>
        <p className="mt-4 text-xs text-stone-500">
          Última lectura:{" "}
          {report.checkedAt.toLocaleString("es-AR", {
            dateStyle: "short",
            timeStyle: "medium",
          })}
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Retención: emails {retention.emailLogDays} días · auditoría{" "}
          {retention.auditLogDays} días.
        </p>
        {params.ok === "maintenance" ? (
          <p
            role="status"
            className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            Mantenimiento ejecutado: {params.rate ?? "0"} rate limits,{" "}
            {params.emails ?? "0"} emails, {params.audit ?? "0"} auditoría,{" "}
            {params.tokens ?? "0"} tokens.
          </p>
        ) : null}
        <div className="mt-5">
          <AdminActionForm
            action={runMaintenanceAdminAction}
            confirmMessage="¿Ejecutar limpieza de rate limits, emails viejos, auditoría y tokens vencidos?"
          >
            <AdminSubmitButton
              idleLabel="Ejecutar mantenimiento ahora"
              pendingLabel="Limpiando…"
              className="rounded-full bg-[#06263a] px-4 py-2.5 text-sm font-semibold text-white"
            />
          </AdminActionForm>
        </div>
      </section>

      {report.alerts.length > 0 ? (
        <section aria-label="Alertas del sistema" className="space-y-3">
          {report.alerts.map((alert) => (
            <div
              key={alert.id}
              role="alert"
              className={
                alert.level === "error"
                  ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                  : "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              }
            >
              <p>{alert.message}</p>
              {alert.href ? (
                <Link
                  href={alert.href}
                  className="mt-2 inline-flex text-sm font-medium underline underline-offset-2"
                >
                  Ver detalle
                </Link>
              ) : null}
            </div>
          ))}
        </section>
      ) : (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          Sin alertas activas.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {report.checks.map((check) => {
          const styles = levelStyles(check.level);
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-stone-800">
                  {check.label}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles.badge}`}
                >
                  {styles.label}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-stone-700">
                {check.summary}
              </p>
              {check.detail ? (
                <p className="mt-2 text-sm text-stone-500">{check.detail}</p>
              ) : null}
            </>
          );

          if (check.href) {
            return (
              <Link
                key={check.id}
                href={check.href}
                className="rounded-3xl bg-white p-5 shadow-sm transition hover:bg-stone-50"
              >
                {body}
              </Link>
            );
          }

          return (
            <article
              key={check.id}
              className="rounded-3xl bg-white p-5 shadow-sm"
            >
              {body}
            </article>
          );
        })}
      </section>
    </div>
  );
}
