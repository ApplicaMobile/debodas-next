import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { updateUserRoleAction } from "@/lib/admin/actions";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import { AdminAccountStatusForm } from "@/components/admin/AdminAccountStatusForm";
import {
  ACCOUNT_STATUS_LABELS,
  normalizeAccountStatus,
} from "@/lib/account/status";

/** Filtro de estado: por defecto se ocultan las eliminadas. */
const STATUS_FILTERS = {
  visibles: { label: "Activas y suspendidas", where: { status: { in: ["active", "suspended"] } } },
  active: { label: "Activas", where: { status: "active" } },
  suspended: { label: "Suspendidas", where: { status: "suspended" } },
  deleted: { label: "Eliminadas", where: { status: "deleted" } },
  todas: { label: "Todas", where: {} },
} satisfies Record<string, { label: string; where: Prisma.UserWhereInput }>;

type StatusFilterKey = keyof typeof STATUS_FILTERS;

function parseStatusFilter(value: string | undefined): StatusFilterKey {
  return value && value in STATUS_FILTERS ? (value as StatusFilterKey) : "visibles";
}

const STATUS_FLASH: Record<string, string> = {
  suspend: "Cuenta suspendida.",
  reactivate: "Cuenta reactivada.",
  delete: "Cuenta eliminada (baja lógica). Podés verla con el filtro Eliminadas.",
  restore: "Cuenta restaurada.",
};

const STATUS_ERRORS: Record<string, string> = {
  self: "No podés suspender ni eliminar tu propia cuenta.",
  last_admin: "No podés suspender ni eliminar al último administrador activo.",
  confirm_email: "Para eliminar, escribí exactamente el email de la cuenta.",
  invalid_transition: "La cuenta ya no está en un estado que permita esa acción. Recargá la página.",
  erased: "Esa cuenta fue borrada definitivamente por la pareja y no se puede modificar.",
  not_found: "No encontramos la cuenta.",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800",
  suspended: "bg-amber-50 text-amber-900",
  deleted: "bg-stone-200 text-stone-600",
};

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{
    ok?: string;
    error?: string;
    q?: string;
    page?: string;
    estado?: string;
  }>;
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const flash = await searchParams;
  const q = (flash.q ?? "").trim();
  const estado = parseStatusFilter(flash.estado);
  const where: Prisma.UserWhereInput = {
    ...STATUS_FILTERS[estado].where,
    ...(q
      ? {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
            { boda: { title: { contains: q } } },
            { boda: { slug: { contains: q } } },
          ],
        }
      : {}),
  };
  const total = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number.parseInt(flash.page ?? "1", 10);
  const page = Math.min(
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    totalPages,
  );

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      boda: { select: { id: true, slug: true, title: true, plan: true } },
    },
  });

  return (
    <div className="space-y-6">
      {flash.ok ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {STATUS_FLASH[flash.ok] ?? "Rol actualizado."}
        </p>
      ) : null}
      {flash.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {STATUS_ERRORS[flash.error] ??
            (flash.error === "self"
              ? "No podés quitarte el rol admin a vos mismo."
              : "No se pudo actualizar la cuenta.")}
        </p>
      ) : null}

      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Usuarios
        </h2>
        <p className="mt-2 text-stone-600">
          {total} cuenta{total === 1 ? "" : "s"}
          {q ? ` para “${q}”` : " en el sistema"}
          {estado !== "todas" ? ` (${STATUS_FILTERS[estado].label.toLowerCase()})` : ""}.
        </p>

        <form className="mt-4 flex flex-wrap gap-2" method="get">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por email, nombre o boda…"
            className="min-w-[220px] flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm"
          />
          <select
            name="estado"
            defaultValue={estado}
            aria-label="Filtrar por estado"
            className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
          >
            {Object.entries(STATUS_FILTERS).map(([key, filter]) => (
              <option key={key} value={key}>
                {filter.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-stone-800 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Buscar
          </button>
          {q || estado !== "visibles" ? (
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
                <th className="px-4 py-3">Estado</th>
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
                    <AdminActionForm
                      action={updateUserRoleAction}
                      className="flex gap-2"
                      confirmMessage={`¿Confirmás el cambio de rol de ${user.email}?`}
                    >
                      <input type="hidden" name="user_id" value={user.id} />
                      <input type="hidden" name="q" value={q} />
                      <input type="hidden" name="page" value={page} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                      >
                        <option value="couple">couple</option>
                        <option value="admin">admin</option>
                      </select>
                      <AdminSubmitButton
                        idleLabel="Guardar"
                        pendingLabel="Guardando…"
                        className="rounded-lg bg-stone-800 px-2.5 py-1.5 text-xs font-semibold text-white"
                      />
                    </AdminActionForm>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {(() => {
                      const status = normalizeAccountStatus(user.status);
                      return (
                        <div className="w-56 space-y-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[status]}`}
                          >
                            {ACCOUNT_STATUS_LABELS[status]}
                          </span>
                          {user.statusReason && status !== "active" ? (
                            <p className="text-xs text-stone-500">
                              Motivo: {user.statusReason}
                            </p>
                          ) : null}
                          {user.statusChangedAt && status !== "active" ? (
                            <p className="text-xs text-stone-400">
                              Desde {user.statusChangedAt.toLocaleDateString("es-AR")}
                            </p>
                          ) : null}
                          <AdminAccountStatusForm
                            userId={user.id}
                            email={user.email}
                            status={status}
                            erased={Boolean(user.erasedAt)}
                            isSelf={user.id === admin.id}
                            returnTo="/admin/usuarios"
                            q={q}
                            page={page}
                            estado={estado}
                            compact
                          />
                        </div>
                      );
                    })()}
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
                    colSpan={5}
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
        <AdminPagination
          pathname="/admin/usuarios"
          currentPage={page}
          totalPages={totalPages}
          query={{
            ...(q ? { q } : {}),
            ...(estado !== "visibles" ? { estado } : {}),
          }}
        />
      </section>
    </div>
  );
}
