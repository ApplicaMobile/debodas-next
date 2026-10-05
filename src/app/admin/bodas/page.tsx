import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { updateBodaPlanAction } from "@/lib/admin/actions";
import {
  coupleLabel,
  eventDateFromJson,
} from "@/lib/admin/format";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { IllustrationRings } from "@/components/account/AccountIllustrations";
import {
  AccountFilterBar,
  AccountPageBody,
  AccountPageHeader,
  AccountSection,
  AccountTable,
  accountCompactControlClass,
  accountTableHeadClass,
  accountTableRowClass,
  accountTableTdClass,
  accountTableThClass,
} from "@/components/account/AccountPage";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import {
  IconDownload,
  Input,
  Select,
  buttonClasses,
  planLabels,
} from "@/components/ui";

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

  const planOptions = ["free", "basico", "premium"] as const;
  const hasFilters = Boolean(query || planFilter);

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/bodas"
        area="Panel admin"
        section="Bodas y clientes"
        title="Bodas"
        description="Micrositios, dueños, planes y actividad de cada boda."
        meta={
          <span className="type-body-sm tabular-nums text-text-secondary">
            {total} resultado{total === 1 ? "" : "s"}.
          </span>
        }
        actions={
          <a
            href={exportHref}
            className={buttonClasses({ variant: "secundario", size: "sm" })}
          >
            <IconDownload size={16} />
            Exportar CSV
          </a>
        }
      />

      <AccountSection
        id="admin-bodas-listado"
        title="Listado de bodas"
        description="Buscá por título, slug, email o nombre del dueño y filtrá por plan. El cambio de plan pide confirmación."
      >
        <AccountFilterBar
          label="Buscar bodas"
          clearHref="/admin/bodas"
          showClear={hasFilters}
        >
          <Input
            id="admin-bodas-search"
            type="search"
            name="q"
            label="Buscar bodas"
            defaultValue={query}
            placeholder="Buscar título, slug o email…"
            className="lg:flex-[2]"
          />
          <Select
            id="admin-bodas-plan"
            name="plan"
            label="Filtrar por plan"
            defaultValue={planFilter}
            options={[
              { value: "", label: "Todos los planes" },
              ...planOptions.map((value) => ({
                value,
                label: planLabels[value],
              })),
            ]}
          />
        </AccountFilterBar>

        <div className="mt-6">
          {bodas.length === 0 ? (
            <AccountEmptyState
              illustration={IllustrationRings}
              title="No hay bodas con ese filtro."
              description={
                hasFilters
                  ? "Probá con otra búsqueda o quitá el filtro de plan."
                  : "Cuando una pareja cree su micrositio, va a aparecer acá."
              }
              actions={
                hasFilters
                  ? [{ label: "Limpiar filtros", href: "/admin/bodas" }]
                  : undefined
              }
            />
          ) : (
            <AccountTable
              caption="Bodas, propietarios, planes y actividad"
              tableClassName="min-[769px]:min-w-[840px]"
            >
                <thead className={accountTableHeadClass}>
                  <tr>
                    <th scope="col" className={accountTableThClass}>Boda</th>
                    <th scope="col" className={accountTableThClass}>Fecha</th>
                    <th scope="col" className={accountTableThClass}>Dueño</th>
                    <th scope="col" className={accountTableThClass}>Plan</th>
                    <th scope="col" className={accountTableThClass}>RSVP / Regalos</th>
                    <th scope="col" className={accountTableThClass}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {bodas.map((boda) => {
                    const name = coupleLabel(boda.couple, boda.title);
                    return (
                      <tr key={boda.id} className={accountTableRowClass}>
                        <td className={`${accountTableTdClass} min-w-[11rem]`} data-primary="">
                          <Link
                            href={`/admin/bodas/${boda.id}`}
                            className="focus-ring rounded-sm font-semibold text-text-primary hover:underline"
                          >
                            {name}
                          </Link>
                          <p className="break-all type-caption text-text-secondary">
                            /{boda.slug}
                          </p>
                          <p className="type-caption text-text-tertiary">
                            {boda.micrositeTheme}
                          </p>
                        </td>
                        <td className={`${accountTableTdClass} whitespace-nowrap`} data-label="Fecha">
                          {eventDateFromJson(boda.event)}
                          <p className="type-caption text-text-tertiary">
                            Alta {boda.createdAt.toLocaleDateString("es-AR")}
                          </p>
                        </td>
                        <td className={`${accountTableTdClass} min-w-[12rem]`} data-label="Dueño">
                          <p className="break-words">{boda.user.name || "—"}</p>
                          <p className="break-all type-caption text-text-secondary">
                            {boda.user.email}
                          </p>
                        </td>
                        <td className={accountTableTdClass} data-label="Plan">
                          <AdminActionForm
                            action={updateBodaPlanAction}
                            className="flex flex-col items-start gap-2"
                            confirmMessage={`¿Confirmás el cambio de plan de ${name}?`}
                          >
                            <input type="hidden" name="boda_id" value={boda.id} />
                            <label htmlFor={`plan-${boda.id}`} className="sr-only">
                              Plan de {name}
                            </label>
                            <select
                              id={`plan-${boda.id}`}
                              name="plan"
                              defaultValue={boda.plan}
                              className={accountCompactControlClass}
                            >
                              {planOptions.map((value) => (
                                <option key={value} value={value}>
                                  {planLabels[value]}
                                </option>
                              ))}
                            </select>
                            <AdminSubmitButton
                              idleLabel="Guardar"
                              pendingLabel="Guardando…"
                              variant="secundario"
                            />
                          </AdminActionForm>
                        </td>
                        <td className={`${accountTableTdClass} whitespace-nowrap text-text-secondary`} data-label="RSVP / Regalos">
                          <p>{boda._count.rsvpGuests} RSVP</p>
                          <p>{boda._count.gifts} regalos</p>
                          <p>{boda._count.ratings} ratings</p>
                        </td>
                        <td className={`${accountTableTdClass} whitespace-nowrap`} data-label="Acciones" data-actions="">
                          <div className="flex flex-col items-start gap-1">
                            <Link
                              href={`/admin/bodas/${boda.id}`}
                              className="focus-ring rounded-sm font-semibold text-text-link hover:underline"
                            >
                              Detalle
                            </Link>
                            <Link
                              href={`/bodas/${boda.slug}`}
                              target="_blank"
                              className="focus-ring rounded-sm font-semibold text-text-accent hover:underline"
                            >
                              Ver sitio <span aria-hidden="true">↗</span>
                              <span className="sr-only"> (se abre en otra pestaña)</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
            </AccountTable>
          )}

          <AdminPagination
            pathname="/admin/bodas"
            currentPage={page}
            totalPages={totalPages}
            query={{
              ...(query ? { q: query } : {}),
              ...(planFilter ? { plan: planFilter } : {}),
            }}
          />
        </div>
      </AccountSection>
    </AccountPageBody>
  );
}
