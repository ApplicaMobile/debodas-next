import Link from "next/link";
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
    { label: "Bodas", value: bodasCount, href: "/admin/bodas", tone: "neutral" as const },
    { label: "Usuarios", value: usersCount, href: "/admin/usuarios", tone: "neutral" as const },
    {
      label: "Ratings pendientes",
      value: pendingRatings,
      href: "/admin/calificaciones?status=pending",
      tone: pendingRatings > 0 ? ("warn" as const) : ("neutral" as const),
    },
    {
      label: "Ratings aprobados",
      value: approvedRatings,
      href: "/admin/calificaciones?status=approved",
      tone: "neutral" as const,
    },
    { label: "Pagos registrados", value: paymentsCount, href: "/admin/pagos", tone: "neutral" as const },
    {
      label: "Regalos por confirmar",
      value: pendingGifts,
      href: "/admin/pagos",
      tone: pendingGifts > 0 ? ("warn" as const) : ("neutral" as const),
    },
  ];

  const planMap = Object.fromEntries(
    planGroups.map((g) => [g.plan, g._count.plan]),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Resumen
        </h2>
        <p className="mt-2 text-stone-600">
          Operación interna de DeBodas (reemplazo del admin de WordPress).
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/admin/estado"
            className="inline-flex text-sm font-medium text-[#6f5f47] hover:underline"
          >
            Estado del sistema →
          </Link>
          <Link
            href="/admin/estadisticas"
            className="inline-flex text-sm font-medium text-[#6f5f47] hover:underline"
          >
            Ver estadísticas de bodas →
          </Link>
        </div>
      </section>

      {systemAlerts.length > 0 ? (
        <section aria-label="Alertas del sistema" className="space-y-3">
          {systemAlerts.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              role="alert"
              className={
                alert.level === "error"
                  ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                  : "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              }
            >
              <p>{alert.message}</p>
              <Link
                href={alert.href ?? "/admin/estado"}
                className="mt-2 inline-flex text-sm font-medium underline underline-offset-2"
              >
                Revisar
              </Link>
            </div>
          ))}
          {systemAlerts.length > 4 ? (
            <Link
              href="/admin/estado"
              className="inline-flex text-sm font-medium text-[#6f5f47] hover:underline"
            >
              Ver las {systemAlerts.length} alertas →
            </Link>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-3xl p-5 shadow-sm transition ${
              card.tone === "warn"
                ? "border border-amber-200 bg-amber-50 hover:bg-amber-100/70"
                : "bg-white hover:bg-stone-50"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-stone-500">
              {card.label}
            </p>
            <p
              className={`mt-2 text-3xl font-semibold ${
                card.tone === "warn" ? "text-amber-950" : "text-stone-800"
              }`}
            >
              {card.value}
            </p>
            {card.tone === "warn" ? (
              <p className="mt-2 text-xs font-medium text-amber-800">
                Requiere atención →
              </p>
            ) : null}
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-800">
            Bodas por plan
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {["free", "basico", "premium"].map((plan) => (
              <li
                key={plan}
                className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3"
              >
                <span className="capitalize text-stone-700">{plan}</span>
                <span className="font-semibold text-stone-800">
                  {planMap[plan] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-800">
              Últimas altas
            </h3>
            <Link
              href="/admin/bodas"
              className="text-sm font-medium text-[#6f5f47] hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-stone-100">
            {recentBodas.map((boda) => (
              <li key={boda.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <Link
                    href={`/admin/bodas/${boda.id}`}
                    className="font-medium text-stone-800 hover:underline"
                  >
                    {boda.title}
                  </Link>
                  <p className="text-xs text-stone-500">{boda.user.email}</p>
                </div>
                <div className="text-right text-xs text-stone-500">
                  <p className="capitalize">{boda.plan}</p>
                  <p>{boda.createdAt.toLocaleDateString("es-AR")}</p>
                </div>
              </li>
            ))}
            {recentBodas.length === 0 ? (
              <li className="py-4 text-stone-500">Sin bodas todavía.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
}
