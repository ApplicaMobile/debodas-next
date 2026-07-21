import Link from "next/link";
import { notFound } from "next/navigation";
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
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/admin/emails"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← Emails
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-stone-800">
              Detalle del email
            </h2>
            <p className="mt-1 break-all text-sm text-stone-500">{email.id}</p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase text-stone-700">
            {email.status}
          </span>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <dl className="grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Destinatario</dt>
            <dd className="mt-1 break-all font-medium text-stone-800">
              {email.toAddress}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Tipo</dt>
            <dd className="mt-1 font-medium text-stone-800">{email.type}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Asunto</dt>
            <dd className="mt-1 font-medium text-stone-800">{email.subject}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Intentos</dt>
            <dd className="mt-1 font-medium text-stone-800">
              {email.attempts}/{email.maxAttempts}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">ID del proveedor</dt>
            <dd className="mt-1 break-all font-medium text-stone-800">
              {email.providerId || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Creado</dt>
            <dd className="mt-1 font-medium text-stone-800">
              {email.createdAt.toLocaleString("es-AR")}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Enviado</dt>
            <dd className="mt-1 font-medium text-stone-800">
              {email.sentAt?.toLocaleString("es-AR") || "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Último error</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-red-700">
              {email.error || "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Metadatos</dt>
            <dd className="mt-2 rounded-2xl bg-stone-50 p-4">
              <code className="whitespace-pre-wrap break-words text-xs text-stone-700">
                {JSON.stringify(email.meta, null, 2)}
              </code>
            </dd>
          </div>
        </dl>

        {canRetry || canDelete ? (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-stone-100 pt-6">
            {canRetry ? (
              <AdminActionForm
                action={retryEmailAdminAction}
                confirmMessage="¿Agregar nuevamente este email a la cola?"
              >
                <input type="hidden" name="email_id" value={email.id} />
                <AdminSubmitButton
                  idleLabel="Reintentar"
                  pendingLabel="Agregando…"
                  className="rounded-full bg-[#06263a] px-4 py-2 text-sm font-semibold text-white"
                />
              </AdminActionForm>
            ) : null}
            {canDelete ? (
              <AdminActionForm
                action={deleteEmailLogAdminAction}
                confirmMessage="¿Eliminar definitivamente este registro de email? Esta acción no se puede deshacer."
              >
                <input type="hidden" name="email_id" value={email.id} />
                <AdminSubmitButton
                  idleLabel="Eliminar registro"
                  pendingLabel="Eliminando…"
                  className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
                />
              </AdminActionForm>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
