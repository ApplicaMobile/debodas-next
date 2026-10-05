import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { updateUserRoleAction } from "@/lib/admin/actions";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { IllustrationGuests } from "@/components/account/AccountIllustrations";
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
import { Alert, Badge, Input } from "@/components/ui";

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{
    ok?: string;
    error?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const flash = await searchParams;
  const q = (flash.q ?? "").trim();
  const where: Prisma.UserWhereInput | undefined = q
    ? {
        OR: [
          { email: { contains: q } },
          { name: { contains: q } },
          { boda: { title: { contains: q } } },
          { boda: { slug: { contains: q } } },
        ],
      }
    : undefined;
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
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/usuarios"
        area="Panel admin"
        section="Bodas y clientes"
        title="Usuarios"
        description="Cuentas del sistema y su rol de acceso."
        meta={
          <span className="type-body-sm tabular-nums text-text-secondary">
            {total} cuenta{total === 1 ? "" : "s"}
            {q ? ` para “${q}”` : " en el sistema"}.
          </span>
        }
      />

      {flash.ok ? <Alert tone="exito" title="Rol actualizado." /> : null}
      {flash.error ? (
        <Alert
          tone="error"
          title={
            flash.error === "self"
              ? "No podés quitarte el rol admin a vos mismo."
              : "No se pudo actualizar el rol."
          }
        />
      ) : null}

      <AccountSection
        id="admin-usuarios-listado"
        title="Cuentas"
        description="Buscá por email, nombre o boda. El cambio de rol pide confirmación."
      >
        <AccountFilterBar
          label="Buscar usuarios"
          submitLabel="Buscar"
          clearHref="/admin/usuarios"
          showClear={Boolean(q)}
        >
          <Input
            id="admin-usuarios-search"
            type="search"
            name="q"
            label="Buscar usuarios"
            defaultValue={q}
            placeholder="Buscar por email, nombre o boda…"
          />
        </AccountFilterBar>

        <div className="mt-6">
          {users.length === 0 ? (
            <AccountEmptyState
              illustration={IllustrationGuests}
              title={
                q
                  ? "No hay usuarios que coincidan con la búsqueda."
                  : "Sin usuarios todavía."
              }
              description={
                q
                  ? "Probá con otro email, nombre o boda."
                  : "Las cuentas nuevas van a aparecer acá."
              }
              actions={
                q ? [{ label: "Limpiar búsqueda", href: "/admin/usuarios" }] : undefined
              }
            />
          ) : (
            <AccountTable caption="Usuarios, roles y bodas" tableClassName="min-w-[720px]">
              <thead className={accountTableHeadClass}>
                <tr>
                  <th scope="col" className={accountTableThClass}>Usuario</th>
                  <th scope="col" className={accountTableThClass}>Rol</th>
                  <th scope="col" className={accountTableThClass}>Boda</th>
                  <th scope="col" className={accountTableThClass}>Alta</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={accountTableRowClass}>
                    <td className={accountTableTdClass}>
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        {user.name || "—"}
                        {user.id === admin.id ? (
                          <Badge tone="info" icon={false}>
                            vos
                          </Badge>
                        ) : null}
                      </p>
                      <p className="break-all type-caption text-text-secondary">
                        {user.email}
                      </p>
                    </td>
                    <td className={accountTableTdClass}>
                      <AdminActionForm
                        action={updateUserRoleAction}
                        className="flex max-w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center"
                        confirmMessage={`¿Confirmás el cambio de rol de ${user.email}?`}
                      >
                        <input type="hidden" name="user_id" value={user.id} />
                        <input type="hidden" name="q" value={q} />
                        <input type="hidden" name="page" value={page} />
                        <label htmlFor={`role-${user.id}`} className="sr-only">
                          Rol de {user.email}
                        </label>
                        <select
                          id={`role-${user.id}`}
                          name="role"
                          defaultValue={user.role}
                          className={accountCompactControlClass}
                        >
                          <option value="couple">couple</option>
                          <option value="admin">admin</option>
                        </select>
                        <AdminSubmitButton
                          idleLabel="Guardar"
                          pendingLabel="Guardando…"
                          variant="secundario"
                        />
                      </AdminActionForm>
                    </td>
                    <td className={accountTableTdClass}>
                      {user.boda ? (
                        <span className="flex max-w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                          <Link
                            href={`/admin/bodas/${user.boda.id}`}
                            className="focus-ring rounded-sm font-semibold text-text-link hover:underline"
                          >
                            {user.boda.title}
                          </Link>
                          <AdminPlanBadge plan={user.boda.plan} />
                        </span>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className={`${accountTableTdClass} whitespace-nowrap text-text-secondary`}>
                      {user.createdAt.toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </AccountTable>
          )}
          <AdminPagination
            pathname="/admin/usuarios"
            currentPage={page}
            totalPages={totalPages}
            query={q ? { q } : {}}
          />
        </div>
      </AccountSection>
    </AccountPageBody>
  );
}
