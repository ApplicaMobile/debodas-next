import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { updateUserRoleAction } from "@/lib/admin/actions";
import { prisma } from "@/lib/db/prisma";

interface PageProps {
  searchParams: Promise<{ ok?: string; error?: string; q?: string }>;
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const flash = await searchParams;
  const q = (flash.q ?? "").trim();

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
            { boda: { title: { contains: q } } },
            { boda: { slug: { contains: q } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      boda: { select: { id: true, slug: true, title: true, plan: true } },
    },
  });

  return (
    <div className="space-y-6">
      {flash.ok ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Rol actualizado.
        </p>
      ) : null}
      {flash.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {flash.error === "self"
            ? "No podés quitarte el rol admin a vos mismo."
            : "No se pudo actualizar el rol."}
        </p>
      ) : null}

      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Usuarios
        </h2>
        <p className="mt-2 text-stone-600">
          {users.length} cuenta{users.length === 1 ? "" : "s"}
          {q ? ` para “${q}”` : " en el sistema"}.
        </p>

        <form className="mt-4 flex flex-wrap gap-2" method="get">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por email, nombre o boda…"
            className="min-w-[220px] flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-stone-800 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Buscar
          </button>
          {q ? (
            <Link
              href="/admin/usuarios"
              className="rounded-full border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700"
            >
              Limpiar
            </Link>
          ) : null}
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Boda</th>
                <th className="px-4 py-3">Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800">
                      {user.name || "—"}
                      {user.id === admin.id ? (
                        <span className="ml-2 text-xs text-stone-400">
                          (vos)
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-stone-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateUserRoleAction} className="flex gap-2">
                      <input type="hidden" name="user_id" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                      >
                        <option value="couple">couple</option>
                        <option value="admin">admin</option>
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
                    {user.boda ? (
                      <Link
                        href={`/admin/bodas/${user.boda.id}`}
                        className="text-[#06263a] hover:underline"
                      >
                        {user.boda.title}{" "}
                        <span className="text-xs text-stone-400">
                          ({user.boda.plan})
                        </span>
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {user.createdAt.toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-stone-500"
                  >
                    {q
                      ? "No hay usuarios que coincidan con la búsqueda."
                      : "Sin usuarios todavía."}
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
