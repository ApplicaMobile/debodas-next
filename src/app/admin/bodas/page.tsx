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
  AccountRowActions,
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
import { AdminAccountStatusBadge } from "@/components/admin/AdminStatusBadge";
import { normalizeAccountStatus } from "@/lib/account/status";
import {
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconExternalLink,
  IconLink,
  IconSubmitButton,
  Input,
  Select,
  buttonClasses,
  planLabels,
} from "@/components/ui";

/** Por defecto se ocultan las bodas de cuentas eliminadas. */
const ESTADO_FILTERS: Record<string, { label: string; where: Prisma.UserWhereInput | null }> = {
  visibles: { label: "Activas y suspendidas", where: { status: { in: ["active", "suspended"] } } },
  active: { label: "Activas", where: { status: "active" } },
  suspended: { label: "Suspendidas", where: { status: "suspended" } },
  deleted: { label: "Eliminadas", where: { status: "deleted" } },
  todas: { label: "Todas", where: null },
};

/** Estado de la cuenta dueña: solo se muestra si no está activa. */
function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeAccountStatus(status);
  if (normalized === "active") return null;
  return <AdminAccountStatusBadge status={normalized} />;
}

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ q?: string; plan?: string; page?: string; estado?: string }>;
}

export default async function AdminBodasPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { q, plan, page: pageRaw, estado: estadoRaw } = await searchParams;
  const estado = estadoRaw && estadoRaw in ESTADO_FILTERS ? estadoRaw : "visibles";
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
  const estadoWhere = ESTADO_FILTERS[estado].where;
  if (estadoWhere) {
    where.user = estadoWhere;
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
      user: { select: { email: true, name: true, status: true } },
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
  const hasFilters = Boolean(query || planFilter) || estado !== "visibles";

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
        description="Buscá por título, slug, email o nombre del dueño y filtrá por plan o estado de la cuenta. Las bodas de cuentas eliminadas se ocultan salvo que las filtres. El cambio de plan pide confirmación."
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
          <Select
            id="admin-bodas-estado"
            name="estado"
            label="Estado de la cuenta"
            defaultValue={estado}
            options={Object.entries(ESTADO_FILTERS).map(([value, filter]) => ({
              value,
              label: filter.label,
            }))}
          />
        </AccountFilterBar>

        <div className="mt-6">
          {bodas.length === 0 ? (
            <AccountEmptyState
              illustration={IllustrationRings}
              title="No hay bodas con ese filtro."
              description={
                hasFilters
                  ? "Probá con otra búsqueda o quitá los filtros de plan y estado."
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
                          <span className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/admin/bodas/${boda.id}`}
                              className="focus-ring rounded-sm font-semibold text-text-primary hover:underline"
                            >
                              {name}
                            </Link>
                            <StatusBadge status={boda.user.status} />
                          </span>
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
                            className="flex items-center gap-2 min-[769px]:flex-col min-[769px]:items-start"
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
                              className={`${accountCompactControlClass} min-[769px]:min-w-[7.5rem]`}
                            >
                              {planOptions.map((value) => (
                                <option key={value} value={value}>
                                  {planLabels[value]}
                                </option>
                              ))}
                            </select>
                            <IconSubmitButton
                              label="Guardar"
                              pendingLabel="Guardando…"
                              icon={<IconCheck />}
                            />
                          </AdminActionForm>
                        </td>
                        <td className={`${accountTableTdClass} whitespace-nowrap text-text-secondary`} data-label="RSVP / Regalos">
                          <p>{boda._count.rsvpGuests} RSVP</p>
                          <p>{boda._count.gifts} regalos</p>
                          <p>{boda._count.ratings} ratings</p>
                        </td>
                        <td className={`${accountTableTdClass} whitespace-nowrap`} data-label="Acciones" data-actions="">
                          <AccountRowActions>
                            <IconLink
                              href={`/admin/bodas/${boda.id}`}
                              label="Detalle"
                              icon={<IconChevronRight />}
                            />
                            <IconLink
                              href={`/bodas/${boda.slug}`}
                              newTab
                              label="Ver sitio (se abre en otra pestaña)"
                              tooltip="Ver sitio"
                              icon={<IconExternalLink />}
                            />
                          </AccountRowActions>
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
              ...(estado !== "visibles" ? { estado } : {}),
            }}
          />
        </div>
      </AccountSection>
    </AccountPageBody>
  );
}
