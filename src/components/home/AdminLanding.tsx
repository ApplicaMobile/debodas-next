import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { adminSections } from "@/lib/admin/sections";
import { prisma } from "@/lib/db/prisma";

const SHORTCUTS = [
  {
    href: "/admin/bodas",
    title: "Bodas",
    description: "Listado, planes y detalle de cada micrositio.",
  },
  {
    href: "/admin/migracion",
    title: "Migración WP",
    description: "Copiar bodas de WordPress a las tablas Prisma.",
  },
  {
    href: "/admin/calificaciones",
    title: "Calificaciones",
    description: "Aprobar o rechazar opiniones de la home.",
  },
  {
    href: "/admin/mercadopago",
    title: "MercadoPago",
    description: "Credenciales, sandbox y webhook para cobrar planes.",
  },
  {
    href: "/admin/pagos",
    title: "Pagos",
    description: "Planes Mercado Pago y regalos pendientes.",
  },
  {
    href: "/admin/estado",
    title: "Estado",
    description: "SMTP, cron, storage y Mercado Pago.",
  },
  {
    href: "/admin/usuarios",
    title: "Usuarios",
    description: "Roles de parejas y administradores.",
  },
] as const;

export async function AdminLanding({
  name,
  email,
}: {
  name: string | null;
  email: string | null;
}) {
  const [bodasCount, pendingRatings, pendingGifts] = await Promise.all([
    prisma.boda.count(),
    prisma.rating.count({ where: { status: "pending" } }),
    prisma.confirmedGift.count({ where: { confirmed: false } }),
  ]);

  const hello = name?.trim() || email || "admin";

  return (
    <div className="min-h-screen bg-[#06263a] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/img/logo-white.svg"
              alt="DeBodas"
              width={140}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact variant="onDark" />
            <Link
              href="/?vista=publica"
              className="hidden text-sm font-medium text-white/80 hover:text-white sm:inline"
            >
              Ver sitio público
            </Link>
            <Link
              href="/admin"
              className="rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800"
            >
              Ir al panel
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(230,218,199,0.18),transparent_50%)]" />
          <div className="relative mx-auto max-w-6xl">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/55">
              Acceso interno
            </p>
            <h1 className="mt-3 max-w-2xl font-serif text-4xl font-semibold sm:text-5xl">
              Hola, {hello}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/75">
              Esta es la entrada del equipo DeBodas. Las parejas ven otra
              landing; acá arrancás la operación del día.
            </p>
            <div className="mt-8 flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-white/50">Bodas</p>
                <p className="text-2xl font-semibold">{bodasCount}</p>
              </div>
              <div>
                <p className="text-white/50">Ratings pendientes</p>
                <p className="text-2xl font-semibold">{pendingRatings}</p>
              </div>
              <div>
                <p className="text-white/50">Regalos por confirmar</p>
                <p className="text-2xl font-semibold">{pendingGifts}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#EBEBEB] px-6 py-14 text-stone-800">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-serif text-2xl font-semibold">Atajos</h2>
            <p className="mt-1 text-sm text-stone-600">
              El resumen con KPIs sigue en el panel.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SHORTCUTS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-3xl bg-white p-6 shadow-sm transition hover:bg-stone-50"
                >
                  <h3 className="text-lg font-semibold text-stone-800">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-stone-600">
                    {item.description}
                  </p>
                  <p className="mt-4 text-sm font-medium text-[#6f5f47]">
                    Abrir →
                  </p>
                </Link>
              ))}
            </div>
            <p className="mt-8 text-sm text-stone-500">
              También:{" "}
              {adminSections
                .filter((section) => section.href !== "/admin")
                .map((section) => (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="mr-3 font-medium text-[#6f5f47] hover:underline"
                  >
                    {section.label}
                  </Link>
                ))}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
