import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { updateRatingStatusAction } from "@/lib/admin/actions";
import { prisma } from "@/lib/db/prisma";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";

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
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Calificaciones
        </h2>
        <p className="mt-2 text-stone-600">
          Aprobá las que quieras mostrar en la home.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active =
              (!validStatus && filter.href === "/admin/calificaciones") ||
              filter.href.endsWith(`status=${validStatus}`);
            return (
              <Link
                key={filter.href}
                href={filter.href}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  active
                    ? "bg-[#06263a] text-white"
                    : "border border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        {ratings.map((rating) => (
          <article
            key={rating.id}
            className="rounded-3xl bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-stone-800">
                  {rating.name}{" "}
                  <span className="font-normal text-[#BA9C5F]">
                    {"★".repeat(rating.score)}
                    {"☆".repeat(5 - rating.score)}
                  </span>
                </p>
                <p className="text-sm text-stone-500">{rating.email}</p>
                <p className="mt-1 text-sm text-stone-600">
                  Boda:{" "}
                  <Link
                    href={`/admin/bodas/${rating.boda.id}`}
                    className="font-medium text-[#06263a] hover:underline"
                  >
                    {rating.boda.title}
                  </Link>
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  rating.status === "approved"
                    ? "bg-emerald-50 text-emerald-700"
                    : rating.status === "rejected"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700"
                }`}
              >
                {rating.status}
              </span>
            </div>

            {rating.comment ? (
              <p className="mt-4 text-sm leading-6 text-stone-700">
                “{rating.comment}”
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {rating.status !== "approved" ? (
                <AdminActionForm action={updateRatingStatusAction}>
                  <input type="hidden" name="rating_id" value={rating.id} />
                  <input type="hidden" name="status" value="approved" />
                  <AdminSubmitButton
                    idleLabel="Aprobar"
                    pendingLabel="Aprobando…"
                    className="rounded-full bg-[#e6dac7] px-4 py-2 text-xs font-semibold text-stone-800"
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
                  <AdminSubmitButton
                    idleLabel="Rechazar"
                    pendingLabel="Rechazando…"
                    className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700"
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
                  <AdminSubmitButton
                    idleLabel="Marcar pendiente"
                    pendingLabel="Actualizando…"
                    className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-500"
                  />
                </AdminActionForm>
              ) : null}
            </div>
          </article>
        ))}

        {ratings.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-stone-500 shadow-sm">
            No hay calificaciones con ese filtro.
          </div>
        ) : null}
      </section>
    </div>
  );
}
