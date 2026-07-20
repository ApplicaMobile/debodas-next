import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { updateBodaPlanAction } from "@/lib/admin/actions";
import {
  coupleLabel,
  eventDateFromJson,
} from "@/lib/admin/format";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{ q?: string; plan?: string }>;
}

export default async function AdminBodasPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { q, plan } = await searchParams;
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

  const bodas = await prisma.boda.findMany({
    where,
    orderBy: { createdAt: "desc" },
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
              {bodas.length} resultado{bodas.length === 1 ? "" : "s"}.
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
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar título, slug o email…"
            className="min-w-[220px] flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm"
          />
          <select
            name="plan"
            defaultValue={planFilter}
            className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
          >
            <option value="">Todos los planes</option>
            <option value="free">free</option>
            <option value="basico">basico</option>
            <option value="premium">premium</option>
          </select>
          <button
            type="submit"
            className="rounded-full bg-[#06263a] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Filtrar
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Boda</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Dueño</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">RSVP / Regalos</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {bodas.map((boda) => (
                <tr key={boda.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800">
                      {coupleLabel(boda.couple, boda.title)}
                    </p>
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
                    <p className="text-stone-800">{boda.user.name || "—"}</p>
                    <p className="text-xs text-stone-500">{boda.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateBodaPlanAction} className="flex gap-2">
                      <input type="hidden" name="boda_id" value={boda.id} />
                      <select
                        name="plan"
                        defaultValue={boda.plan}
                        className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                      >
                        <option value="free">free</option>
                        <option value="basico">basico</option>
                        <option value="premium">premium</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-stone-800 px-2.5 py-1.5 text-xs font-semibold text-white"
                      >
                        Guardar
                      </button>
                    </form>
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
                        className="font-medium text-[#e6dac7] hover:underline"
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
      </section>
    </div>
  );
}
