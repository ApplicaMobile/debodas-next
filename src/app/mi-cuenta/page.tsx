import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { accountSections } from "@/lib/account/sections";
import { prisma } from "@/lib/db/prisma";

export default async function MiCuentaPage() {
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        include: { boda: true },
      })
    : null;

  const pendingGiftsCount = user?.boda
    ? await prisma.confirmedGift.count({
        where: { bodaId: user.boda.id, confirmed: false },
      })
    : 0;

  const editableSections = accountSections.filter(
    (item) => !item.exact && item.available,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h2 className="font-serif text-xl font-semibold text-stone-800 sm:text-2xl">
          Bienvenido{user?.name ? `, ${user.name}` : ""}
        </h2>
        <p className="mt-2 text-stone-600">
          Editá tu micrositio desde el panel. Los cambios se reflejan en el
          sitio público al guardar.
        </p>
        {user?.boda ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                Plan
              </p>
              <p className="mt-1 font-semibold capitalize text-stone-800">
                {user.boda.plan}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                Tema
              </p>
              <p className="mt-1 font-semibold text-stone-800">
                {user.boda.micrositeTheme}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                Regalos pendientes
              </p>
              <p className="mt-1 font-semibold text-stone-800">
                {pendingGiftsCount}
              </p>
              {pendingGiftsCount > 0 ? (
                <Link
                  href="/mi-cuenta/regalos-recibidos"
                  className="mt-2 inline-block text-sm font-medium text-[#6f5f47] hover:underline"
                >
                  Revisar →
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h3 className="text-lg font-semibold text-stone-800">Secciones</h3>
        <ul className="mt-4 divide-y divide-stone-100">
          {editableSections.map((item) => (
            <li
              key={item.href}
              className="flex items-center justify-between py-3"
            >
              <Link
                href={item.href}
                className="font-medium text-[#6f5f47] hover:underline"
              >
                {item.label}
                {item.href === "/mi-cuenta/regalos-recibidos" &&
                pendingGiftsCount > 0
                  ? ` (${pendingGiftsCount})`
                  : ""}
              </Link>
              <span className="text-xs text-stone-400">Editar →</span>
            </li>
          ))}
        </ul>
        {user?.boda ? (
          <Link
            href={`/bodas/${user.boda.slug}`}
            className="mt-6 inline-flex rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800"
          >
            Ver micrositio
          </Link>
        ) : null}
      </section>
    </div>
  );
}
