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
import { AdminPlanBadge } from "@/components/admin/AdminStatusBadge";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import {
  Button,
  IconDownload,
  IconExternalLink,
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
            <>
              <ul role="list" className="space-y-3 lg:hidden">
                {bodas.map((boda) => {
                  const name = coupleLabel(boda.couple, boda.title);
                  return (
                    <li key={boda.id}>
                      <article className="space-y-4 rounded-md border border-border-subtle bg-surface-default p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/admin/bodas/${boda.id}`}
                              className="focus-ring rounded-sm type-label text-text-primary underline-offset-4 hover:underline"
                            >
                              {name}
                            </Link>
                            <p className="mt-1 break-all type-caption text-text-secondary">
                              /{boda.slug}
                            </p>
                          </div>
                          <AdminPlanBadge plan={boda.plan} />
                        </div>
                        <dl className="grid grid-cols-2 gap-3">
                          <div>
                            <dt className="type-caption font-semibold text-text-tertiary">
                              Fecha
                            </dt>
                            <dd className="mt-1 type-body-sm text-text-primary">
                              {eventDateFromJson(boda.event)}
                            </dd>
                          </div>
                          <div>
                            <dt className="type-caption font-semibold text-text-tertiary">
                              Dueño
                            </dt>
                            <dd className="mt-1 break-all type-body-sm text-text-primary">
                              {boda.user.email}
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="type-caption font-semibold text-text-tertiary">
                              Actividad
                            </dt>
                            <dd className="mt-1 type-body-sm text-text-primary">
                              {boda._count.rsvpGuests} RSVP · {boda._count.gifts}{" "}
                              regalos · {boda._count.ratings} ratings
                            </dd>
                          </div>
                        </dl>
                        <AdminActionForm
                          action={updateBodaPlanAction}
                          className="flex max-w-full flex-col items-stretch gap-2 sm:flex-row sm:items-end"
                          confirmMessage={`¿Confirmás el cambio de plan de ${name}?`}
                        >
                          <input type="hidden" name="boda_id" value={boda.id} />
                          <div className="min-w-0 flex-1">
                            <label
                              htmlFor={`mobile-plan-${boda.id}`}
                              className="mb-1 block type-caption font-semibold text-text-secondary"
                            >
                              Plan
                              <span className="sr-only"> de {name}</span>
                            </label>
                            <select
                              id={`mobile-plan-${boda.id}`}
                              name="plan"
                              defaultValue={boda.plan}
                              className={`${accountCompactControlClass} w-full`}
                            >
                              {planOptions.map((value) => (
                                <option key={value} value={value}>
                                  {planLabels[value]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <AdminSubmitButton
                            idleLabel="Guardar"
                            pendingLabel="Guardando…"
                            variant="secundario"
                          />
                        </AdminActionForm>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            href={`/admin/bodas/${boda.id}`}
                            size="sm"
                          >
                            Ver detalle
                          </Button>
                          <Button
                            href={`/bodas/${boda.slug}`}
                            target="_blank"
                            variant="fantasma"
                            size="sm"
                            icon={<IconExternalLink size={16} />}
                            iconPosition="end"
                          >
                            Ver sitio
                            <span className="sr-only"> (se abre en otra pestaña)</span>
                          </Button>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>

              <AccountTable
                caption="Bodas, propietarios, planes y actividad"
                className="hidden lg:block"
                tableClassName="min-w-[840px]"
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
                        <td className={`${accountTableTdClass} min-w-[11rem]`}>
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
                        <td className={`${accountTableTdClass} whitespace-nowrap`}>
                          {eventDateFromJson(boda.event)}
                          <p className="type-caption text-text-tertiary">
                            Alta {boda.createdAt.toLocaleDateString("es-AR")}
                          </p>
                        </td>
                        <td className={`${accountTableTdClass} min-w-[12rem]`}>
                          <p className="break-words">{boda.user.name || "—"}</p>
                          <p className="break-all type-caption text-text-secondary">
                            {boda.user.email}
                          </p>
                        </td>
                        <td className={accountTableTdClass}>
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
                        <td className={`${accountTableTdClass} whitespace-nowrap text-text-secondary`}>
                          <p>{boda._count.rsvpGuests} RSVP</p>
                          <p>{boda._count.gifts} regalos</p>
                          <p>{boda._count.ratings} ratings</p>
                        </td>
                        <td className={`${accountTableTdClass} whitespace-nowrap`}>
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
            </>
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
