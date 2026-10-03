import Link from "next/link";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { IllustrationRings } from "@/components/account/AccountIllustrations";
import {
  AccountPageBody,
  AccountPageHeader,
  AccountSection,
  AccountStatCard,
} from "@/components/account/AccountPage";
import { AdminPlanBadge } from "@/components/admin/AdminStatusBadge";
import { Alert, Button } from "@/components/ui";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSystemAlerts } from "@/lib/admin/system-health";
import { prisma } from "@/lib/db/prisma";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [
    bodasCount,
    usersCount,
    pendingRatings,
    approvedRatings,
    paymentsCount,
    pendingGifts,
    planGroups,
    recentBodas,
    systemAlerts,
  ] = await Promise.all([
    prisma.boda.count(),
    prisma.user.count(),
    prisma.rating.count({ where: { status: "pending" } }),
    prisma.rating.count({ where: { status: "approved" } }),
    prisma.payment.count(),
    prisma.confirmedGift.count({ where: { confirmed: false } }),
    prisma.boda.groupBy({
      by: ["plan"],
      _count: { plan: true },
    }),
    prisma.boda.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        plan: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
    getSystemAlerts(),
  ]);

  const cards = [
    {
      label: "Bodas",
      value: bodasCount,
      href: "/admin/bodas",
      iconHref: "/admin/bodas",
      warn: false,
    },
    {
      label: "Usuarios",
      value: usersCount,
      href: "/admin/usuarios",
      iconHref: "/admin/usuarios",
      warn: false,
    },
    {
      label: "Ratings pendientes",
      value: pendingRatings,
      href: "/admin/calificaciones?status=pending",
      iconHref: "/admin/calificaciones",
      warn: pendingRatings > 0,
    },
    {
      label: "Ratings aprobados",
      value: approvedRatings,
      href: "/admin/calificaciones?status=approved",
      iconHref: "/admin/calificaciones",
      warn: false,
    },
    {
      label: "Pagos registrados",
      value: paymentsCount,
      href: "/admin/pagos",
      iconHref: "/admin/pagos",
      warn: false,
    },
    {
      label: "Regalos por confirmar",
      value: pendingGifts,
      href: "/admin/pagos",
      iconHref: "/admin/pagos",
      warn: pendingGifts > 0,
    },
  ];

  const planMap = Object.fromEntries(
    planGroups.map((g) => [g.plan, g._count.plan]),
  );

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/admin"
        area="Panel admin"
        section="Inicio"
        title="Resumen"
        description="Operación interna de DeBodas (reemplazo del admin de WordPress)."
        meta={
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              { href: "/admin/estado", label: "Estado del sistema" },
              { href: "/admin/estadisticas", label: "Ver estadísticas de bodas" },
              { href: "/admin/mercadopago", label: "Configurar MercadoPago" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="focus-ring inline-flex min-h-9 items-center gap-1 rounded-sm type-body-sm font-semibold text-text-link hover:underline"
                >
                  {link.label} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        }
      />

      {systemAlerts.length > 0 ? (
        <section aria-label="Alertas del sistema" className="space-y-3">
          {systemAlerts.slice(0, 4).map((alert) => (
            <Alert
              key={alert.id}
              tone={alert.level === "error" ? "error" : "pendiente"}
              title={alert.message}
              action={
                <Button
                  href={alert.href ?? "/admin/estado"}
                  variant="fantasma"
                  size="sm"
                >
                  Revisar
                </Button>
              }
            />
          ))}
          {systemAlerts.length > 4 ? (
            <Link
              href="/admin/estado"
              className="focus-ring inline-flex rounded-sm type-body-sm font-semibold text-text-link hover:underline"
            >
              Ver las {systemAlerts.length} alertas →
            </Link>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="admin-indicadores">
        <h3 id="admin-indicadores" className="type-h4 text-text-primary">
          Indicadores
        </h3>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <AccountStatCard
              key={card.label}
              href={card.href}
              iconHref={card.iconHref}
              label={card.label}
              value={card.value}
              detail={card.warn ? "Requiere atención →" : undefined}
              highlight={card.warn}
            />
          ))}
        </ul>
      </section>

      <div className="grid gap-6 sm:gap-8 xl:grid-cols-2">
        <AccountSection
          id="admin-bodas-por-plan"
          title="Bodas por plan"
          description="Cantidad de micrositios en cada plan."
        >
          <ul className="divide-y divide-border-subtle rounded-md border border-border-subtle">
            {["free", "basico", "premium"].map((plan) => (
              <li
                key={plan}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <AdminPlanBadge plan={plan} />
                <span className="type-label tabular-nums text-text-primary">
                  {planMap[plan] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </AccountSection>

        <AccountSection
          id="admin-ultimas-altas"
          title="Últimas altas"
          description="Las cinco bodas creadas más recientemente."
          actions={
            <Button href="/admin/bodas" variant="fantasma" size="sm">
              Ver todas
            </Button>
          }
        >
          {recentBodas.length > 0 ? (
            <ul className="divide-y divide-border-subtle">
              {recentBodas.map((boda) => (
                <li
                  key={boda.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/bodas/${boda.id}`}
                      className="focus-ring rounded-sm type-label text-text-primary hover:underline"
                    >
                      {boda.title}
                    </Link>
                    <p className="break-all type-caption text-text-secondary">
                      {boda.user.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <AdminPlanBadge plan={boda.plan} />
                    <span className="type-caption tabular-nums text-text-tertiary">
                      {boda.createdAt.toLocaleDateString("es-AR")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <AccountEmptyState
              illustration={IllustrationRings}
              title="Sin bodas todavía."
              description="Cuando una pareja cree su micrositio, va a aparecer acá."
            />
          )}
        </AccountSection>
      </div>
    </AccountPageBody>
  );
}
