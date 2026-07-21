import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { updateBodaPlanAction } from "@/lib/admin/actions";
import {
  coupleLabel,
  eventDateFromJson,
} from "@/lib/admin/format";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ q?: string; plan?: string; page?: string }>;
}

export default async function AdminBodasPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { q, plan, page: pageRaw } = await searchParams;
  const query = (q ?? "").trim();
  const planFilter = (plan ?? "").trim().toLowerCase();

  const where: Prisma.BodaWhereInput = {};
  if (query) {
    where.OR = [
      { title: { contains: query } },
      { slug: { contains: query } },
      { user: { email: { contains: query } } },
      { user: { name: { contains: query } } },
    ];
  }
  if (planFilter && ["free", "basico", "premium"].includes(planFilter)) {
    where.plan = planFilter;
  }

  const total = await prisma.boda.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number.parseInt(pageRaw ?? "1", 10);
  const page = Math.min(
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    totalPages,
  );
  const bodas = await prisma.boda.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      user: { select: { email: true, name: true } },
      _count: {
        select: {
          gifts: true,
          rsvpGuests: true,
          ratings: true,
        },
      },
    },
  });

  const exportHref = `/admin/bodas/export${
    query || planFilter
      ? `?${new URLSearchParams({
          ...(query ? { q: query } : {}),
          ...(planFilter ? { plan: planFilter } : {}),
        }).toString()}`
      : ""
  }`;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-stone-800">
              Bodas
            </h2>
            <p className="mt-2 text-stone-600">
              {total} resultado{total === 1 ? "" : "s"}.
            </p>
          </div>
          <a
            href={exportHref}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Exportar CSV
          </a>
        </div>

        <form className="mt-6 flex flex-wrap gap-3" method="get">
          <label htmlFor="admin-bodas-search" className="sr-only">
            Buscar bodas
          </label>
          <input
            id="admin-bodas-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar título, slug o email…"
            className="min-w-[220px] flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm"
          />
          <label htmlFor="admin-bodas-plan" className="sr-only">
            Filtrar por plan
          </label>
          <select
            id="admin-bodas-plan"
            name="plan"
            defaultValue={planFilter}
            className="min-h-11 rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
          >
            <option value="">Todos los planes</option>
            <option value="free">free</option>
            <option value="basico">basico</option>
            <option value="premium">premium</option>
          </select>
          <button
            type="submit"
            className="min-h-11 rounded-full bg-[#06263a] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Filtrar
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <h3 className="sr-only">Listado de bodas</h3>
        <div className="divide-y divide-stone-100 lg:hidden">
          {bodas.map((boda) => (
            <article key={boda.id} className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/bodas/${boda.id}`}
                    className="text-base font-semibold text-stone-800 underline-offset-4 hover:underline"
                  >
                    {coupleLabel(boda.couple, boda.title)}
                  </Link>
                  <p className="mt-1 break-all text-xs text-stone-500">
                    /{boda.slug}
                  </p>
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                  {boda.plan}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-stone-500">Fecha</dt>
                  <dd className="mt-1 text-stone-800">
                    {eventDateFromJson(boda.event)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-stone-500">Dueño</dt>
                  <dd className="mt-1 break-all text-stone-800">
                    {boda.user.email}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-stone-500">
                    Actividad
                  </dt>
                  <dd className="mt-1 text-stone-800">
                    {boda._count.rsvpGuests} RSVP · {boda._count.gifts} regalos ·{" "}
                    {boda._count.ratings} ratings
                  </dd>
                </div>
              </dl>
              <AdminActionForm
                action={updateBodaPlanAction}
                className="flex gap-2"
                confirmMessage={`¿Confirmás el cambio de plan de ${coupleLabel(boda.couple, boda.title)}?`}
              >
                <input type="hidden" name="boda_id" value={boda.id} />
                <label htmlFor={`mobile-plan-${boda.id}`} className="sr-only">
                  Plan de {coupleLabel(boda.couple, boda.title)}
                </label>
                <select
                  id={`mobile-plan-${boda.id}`}
                  name="plan"
                  defaultValue={boda.plan}
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-stone-300 px-3 text-sm"
                >
                  <option value="free">free</option>
                  <option value="basico">basico</option>
                  <option value="premium">premium</option>
                </select>
                <AdminSubmitButton
                  idleLabel="Guardar"
                  pendingLabel="Guardando…"
                  className="min-h-11 rounded-xl bg-stone-800 px-4 text-sm font-semibold text-white"
                />
              </AdminActionForm>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/bodas/${boda.id}`}
                  className="inline-flex min-h-11 items-center rounded-xl bg-[#06263a] px-4 text-sm font-semibold text-white"
                >
                  Ver detalle
                </Link>
                <Link
                  href={`/bodas/${boda.slug}`}
                  target="_blank"
                  className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-700"
                >
                  Ver sitio ↗
                </Link>
              </div>
            </article>
          ))}
          {bodas.length === 0 ? (
            <p className="p-8 text-center text-stone-500">
              No hay bodas con ese filtro.
            </p>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[900px] table-fixed text-left text-sm">
            <caption className="sr-only">
              Bodas, propietarios, planes y actividad
            </caption>
            <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th scope="col" className="w-[18%] px-4 py-3">Boda</th>
                <th scope="col" className="w-[12%] px-4 py-3">Fecha</th>
                <th scope="col" className="w-[22%] px-4 py-3">Dueño</th>
                <th scope="col" className="w-[20%] px-4 py-3">Plan</th>
                <th scope="col" className="w-[15%] px-4 py-3">RSVP / Regalos</th>
                <th scope="col" className="w-[13%] px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {bodas.map((boda) => (
                <tr key={boda.id} className="align-top">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/bodas/${boda.id}`}
                      className="font-medium text-stone-800 hover:text-[#06263a] hover:underline"
                    >
                      {coupleLabel(boda.couple, boda.title)}
                    </Link>
                    <p className="text-xs text-stone-500">/{boda.slug}</p>
                    <p className="text-xs text-stone-400">{boda.micrositeTheme}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {eventDateFromJson(boda.event)}
                    <p className="text-xs text-stone-400">
                      Alta {boda.createdAt.toLocaleDateString("es-AR")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="break-words text-stone-800">
                      {boda.user.name || "—"}
                    </p>
                    <p className="break-all text-xs text-stone-500">
                      {boda.user.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <AdminActionForm
                      action={updateBodaPlanAction}
                      className="flex gap-2"
                      confirmMessage={`¿Confirmás el cambio de plan de ${coupleLabel(boda.couple, boda.title)}?`}
                    >
                      <input type="hidden" name="boda_id" value={boda.id} />
                      <label htmlFor={`plan-${boda.id}`} className="sr-only">
                        Plan de {coupleLabel(boda.couple, boda.title)}
                      </label>
                      <select
                        id={`plan-${boda.id}`}
                        name="plan"
                        defaultValue={boda.plan}
                        className="min-h-11 min-w-0 rounded-lg border border-stone-300 px-2 text-sm"
                      >
                        <option value="free">free</option>
                        <option value="basico">basico</option>
                        <option value="premium">premium</option>
                      </select>
                      <AdminSubmitButton
                        idleLabel="Guardar"
                        pendingLabel="Guardando…"
                        className="min-h-11 rounded-lg bg-stone-800 px-3 text-xs font-semibold text-white"
                      />
                    </AdminActionForm>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {boda._count.rsvpGuests} RSVP · {boda._count.gifts} regalos ·{" "}
                    {boda._count.ratings} ratings
                  </td>
                  <td className="px-4 py-3 space-y-1">
                    <div>
                      <Link
                        href={`/admin/bodas/${boda.id}`}
                        className="font-medium text-[#06263a] hover:underline"
                      >
                        Detalle
                      </Link>
                    </div>
                    <div>
                      <Link
                        href={`/bodas/${boda.slug}`}
                        target="_blank"
                        className="font-medium text-[#6f5f47] hover:underline"
                      >
                        Ver sitio ↗
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {bodas.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-stone-500"
                  >
                    No hay bodas con ese filtro.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <AdminPagination
          pathname="/admin/bodas"
          currentPage={page}
          totalPages={totalPages}
          query={{
            ...(query ? { q: query } : {}),
            ...(planFilter ? { plan: planFilter } : {}),
          }}
        />
      </section>
    </div>
  );
}
