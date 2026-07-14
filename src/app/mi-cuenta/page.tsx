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

  const editableSections = accountSections.filter(
    (item) => !item.exact && item.available,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Bienvenido{user?.name ? `, ${user.name}` : ""}
        </h2>
        <p className="mt-2 text-stone-600">
          Editá tu micrositio desde el panel. Los cambios se reflejan en el
          sitio público al guardar.
        </p>
        {user?.boda ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-800">Secciones</h3>
        <ul className="mt-4 divide-y divide-stone-100">
          {editableSections.map((item) => (
            <li
              key={item.href}
              className="flex items-center justify-between py-3"
            >
              <Link
                href={item.href}
                className="font-medium text-[#556B2F] hover:underline"
              >
                {item.label}
              </Link>
              <span className="text-xs text-stone-400">Editar →</span>
            </li>
          ))}
        </ul>
        {user?.boda ? (
          <Link
            href={`/bodas/${user.boda.slug}`}
            className="mt-6 inline-flex rounded-full bg-[#556B2F] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Ver micrositio
          </Link>
        ) : null}
      </section>
    </div>
  );
}
