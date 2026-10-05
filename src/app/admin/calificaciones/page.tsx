import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { updateRatingStatusAction } from "@/lib/admin/actions";
import { prisma } from "@/lib/db/prisma";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { IllustrationStars } from "@/components/account/AccountIllustrations";
import {
  AccountFilterChipLink,
  AccountPageBody,
  AccountPageHeader,
  AccountRowActions,
  AccountSection,
} from "@/components/account/AccountPage";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import {
  Badge,
  IconCheck,
  IconClock,
  IconSubmitButton,
  IconX,
} from "@/components/ui";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminCalificacionesPage({
  searchParams,
}: PageProps) {
  await requireAdmin();
  const { status: statusRaw } = await searchParams;
  const status = (statusRaw ?? "").trim();
  const validStatus = ["pending", "approved", "rejected"].includes(status)
    ? status
    : undefined;

  const ratings = await prisma.rating.findMany({
    where: validStatus ? { status: validStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      boda: { select: { id: true, title: true, slug: true } },
    },
  });

  const filters = [
    { href: "/admin/calificaciones", label: "Todas" },
    { href: "/admin/calificaciones?status=pending", label: "Pendientes" },
    { href: "/admin/calificaciones?status=approved", label: "Aprobadas" },
    { href: "/admin/calificaciones?status=rejected", label: "Rechazadas" },
  ];

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/calificaciones"
        area="Panel admin"
        section="Bodas y clientes"
        title="Calificaciones"
        description="Aprobá las que quieras mostrar en la home."
      />

      <AccountSection
        id="admin-calificaciones-listado"
        title="Reseñas"
        badge={
          <Badge tone="neutro" icon={false}>
            {ratings.length}
          </Badge>
        }
        description="Filtrá por estado. Rechazar o volver a pendiente pide confirmación."
      >
        <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active =
              (!validStatus && filter.href === "/admin/calificaciones") ||
              filter.href.endsWith(`status=${validStatus}`);
            return (
              <AccountFilterChipLink
                key={filter.href}
                href={filter.href}
                active={active}
              >
                {filter.label}
              </AccountFilterChipLink>
            );
          })}
        </nav>

        <div className="mt-6">
          {ratings.length === 0 ? (
            <AccountEmptyState
              illustration={IllustrationStars}
              title="No hay calificaciones con ese filtro."
              description="Cuando las parejas califiquen el servicio, sus reseñas van a aparecer acá para moderarlas."
            />
          ) : (
            <ul role="list" className="space-y-3">
              {ratings.map((rating) => (
                <li key={rating.id}>
                  <article className="rounded-md border border-border-subtle bg-surface-default p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 type-label text-text-primary">
                          {rating.name}
                          <span
                            className="font-normal tracking-wider text-text-accent"
                            aria-hidden="true"
                          >
                            {"★".repeat(rating.score)}
                            {"☆".repeat(5 - rating.score)}
                          </span>
                          <span className="sr-only">
                            {rating.score} de 5 estrellas
                          </span>
                        </p>
                        <p className="break-all type-body-sm text-text-secondary">
                          {rating.email}
                        </p>
                        <p className="mt-1 type-body-sm text-text-secondary">
                          Boda:{" "}
                          <Link
                            href={`/admin/bodas/${rating.boda.id}`}
                            className="focus-ring rounded-sm font-semibold text-text-link hover:underline"
                          >
                            {rating.boda.title}
                          </Link>
                        </p>
                      </div>
                      <AdminStatusBadge kind="rating" status={rating.status} />
                    </div>

                    {rating.comment ? (
                      <blockquote className="mt-4 border-l-2 border-border-accent pl-4 type-body-sm text-text-primary">
                        “{rating.comment}”
                      </blockquote>
                    ) : null}

                    <AccountRowActions className="mt-4 border-t border-border-subtle pt-4">
                      {rating.status !== "approved" ? (
                        <AdminActionForm action={updateRatingStatusAction}>
                          <input type="hidden" name="rating_id" value={rating.id} />
                          <input type="hidden" name="status" value="approved" />
                          <IconSubmitButton
                            label="Aprobar"
                            pendingLabel="Aprobando…"
                            icon={<IconCheck />}
                            variant="primary"
                          />
                        </AdminActionForm>
                      ) : null}
                      {rating.status !== "rejected" ? (
                        <AdminActionForm
                          action={updateRatingStatusAction}
                          confirmMessage="¿Confirmás que querés rechazar esta calificación?"
                        >
                          <input type="hidden" name="rating_id" value={rating.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <IconSubmitButton
                            label="Rechazar"
                            pendingLabel="Rechazando…"
                            icon={<IconX />}
                          />
                        </AdminActionForm>
                      ) : null}
                      {rating.status !== "pending" ? (
                        <AdminActionForm
                          action={updateRatingStatusAction}
                          confirmMessage="¿Confirmás que querés quitar esta calificación de su estado actual?"
                        >
                          <input type="hidden" name="rating_id" value={rating.id} />
                          <input type="hidden" name="status" value="pending" />
                          <IconSubmitButton
                            label="Marcar pendiente"
                            pendingLabel="Actualizando…"
                            icon={<IconClock />}
                          />
                        </AdminActionForm>
                      ) : null}
                    </AccountRowActions>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </AccountSection>
    </AccountPageBody>
  );
}
