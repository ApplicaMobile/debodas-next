import { notFound } from "next/navigation";
import {
  AccountDetailList,
  AccountFormActions,
  AccountPageBody,
  AccountPageHeader,
  AccountSection,
} from "@/components/account/AccountPage";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import {
  deleteEmailLogAdminAction,
  retryEmailAdminAction,
} from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEmailDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const email = await prisma.emailLog.findUnique({ where: { id } });
  if (!email) notFound();

  const canRetry =
    ["failed", "blocked"].includes(email.status) && email.contentEncrypted;
  const canDelete = ["failed", "blocked", "skipped", "cancelled"].includes(
    email.status,
  );

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/emails"
        area="Panel admin"
        section="Operación"
        back={{ href: "/admin/emails", label: "Emails" }}
        title="Detalle del email"
        description={<span className="break-all">{email.id}</span>}
        meta={<AdminStatusBadge kind="email" status={email.status} />}
      />

      <AccountSection
        id="admin-email-detalle"
        title={email.subject}
        description={`Para ${email.toAddress}`}
      >
        <AccountDetailList
          items={[
            {
              label: "Destinatario",
              value: <span className="break-all">{email.toAddress}</span>,
            },
            { label: "Tipo", value: email.type },
            { label: "Asunto", value: email.subject, wide: true },
            {
              label: "Intentos",
              value: (
                <span className="tabular-nums">
                  {email.attempts}/{email.maxAttempts}
                </span>
              ),
            },
            {
              label: "ID del proveedor",
              value: <span className="break-all">{email.providerId || "—"}</span>,
            },
            { label: "Creado", value: email.createdAt.toLocaleString("es-AR") },
            {
              label: "Enviado",
              value: email.sentAt?.toLocaleString("es-AR") || "—",
            },
            {
              label: "Último error",
              wide: true,
              value: (
                <span
                  className={
                    email.error
                      ? "whitespace-pre-wrap text-status-error-fg"
                      : "text-text-tertiary"
                  }
                >
                  {email.error || "—"}
                </span>
              ),
            },
            {
              label: "Metadatos",
              wide: true,
              value: (
                <pre className="mt-1 overflow-x-auto rounded-md border border-border-subtle bg-surface-muted p-4">
                  <code className="whitespace-pre-wrap break-words type-caption text-text-primary">
                    {JSON.stringify(email.meta, null, 2)}
                  </code>
                </pre>
              ),
            },
          ]}
        />

        {canRetry || canDelete ? (
          <AccountFormActions>
            {canDelete ? (
              <AdminActionForm
                action={deleteEmailLogAdminAction}
                confirmMessage="¿Eliminar definitivamente este registro de email? Esta acción no se puede deshacer."
              >
                <AdminSubmitButton
                  idleLabel="Eliminar registro"
                  pendingLabel="Eliminando…"
                  variant="peligro"
                  size="md"
                  fullWidth
                />
                <input type="hidden" name="email_id" value={email.id} />
              </AdminActionForm>
            ) : null}
            {canRetry ? (
              <AdminActionForm
                action={retryEmailAdminAction}
                confirmMessage="¿Agregar nuevamente este email a la cola?"
              >
                <input type="hidden" name="email_id" value={email.id} />
                <AdminSubmitButton
                  idleLabel="Reintentar"
                  pendingLabel="Agregando…"
                  variant="primario"
                  size="md"
                  fullWidth
                />
              </AdminActionForm>
            ) : null}
          </AccountFormActions>
        ) : null}
      </AccountSection>
    </AccountPageBody>
  );
}
