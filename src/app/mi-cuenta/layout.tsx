import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountNotificationsBell } from "@/components/account/AccountNotificationsBell";
import {
  AccountBreadcrumb,
  AccountSidebar,
} from "@/components/account/AccountSidebar";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { IconExternalLink, PlanBadge, type PlanId } from "@/components/ui";
import { VERIFY_EMAIL_PATH } from "@/lib/auth/register-account";
import { isAdminRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getBodaNotifications } from "@/lib/notifications/queries";
import { normalizePlan } from "@/lib/plans/features";

export default async function MiCuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/mi-cuenta");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      boda: { select: { id: true, slug: true, title: true, plan: true } },
    },
  });

  if (user && isAdminRole(user.role) && !user.boda) {
    redirect("/");
  }

  // Registro sin verificar: el panel queda bloqueado hasta confirmar el email.
  if (user && !user.emailVerifiedAt && !isAdminRole(user.role)) {
    redirect(VERIFY_EMAIL_PATH);
  }

  const notifications = user?.boda
    ? await getBodaNotifications(user.boda.id)
    : { items: [], unreadCount: 0 };

  const pendingGiftsCount = user?.boda
    ? await prisma.confirmedGift.count({
        where: { bodaId: user.boda.id, confirmed: false },
      })
    : 0;

  const sidebarBadges = {
    ...(pendingGiftsCount > 0
      ? { "/mi-cuenta/regalos-recibidos": pendingGiftsCount }
      : {}),
    ...(notifications.unreadCount > 0
      ? { "/mi-cuenta/notificaciones": notifications.unreadCount }
      : {}),
  };

  const sidebarBoda = user?.boda
    ? {
        title: user.boda.title,
        slug: user.boda.slug,
        plan: normalizePlan(user.boda.plan) as PlanId,
      }
    : null;

  return (
    <div className="min-h-screen bg-bg-canvas text-text-primary">
      <a
        href="#contenido"
        className="focus-ring sr-only z-[60] rounded-full bg-action-primary-bg px-4 py-2 type-button-sm text-action-primary-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface-default/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="focus-ring inline-flex min-h-11 shrink-0 items-center rounded-sm font-serif text-xl font-semibold text-text-primary"
            >
              DeBodas
              <span className="sr-only"> (ir al sitio principal)</span>
            </Link>
            <span
              aria-hidden="true"
              className="hidden h-6 w-px bg-border-default sm:block"
            />
            <div className="sr-only min-w-0 sm:not-sr-only sm:block">
              <h1 className="type-label text-text-primary">Mi cuenta</h1>
              {user?.email ? (
                <p className="truncate type-caption text-text-tertiary">
                  {user.email}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {user?.boda ? (
              <a
                href={`/bodas/${user.boda.slug}`}
                target="_blank"
                rel="noopener"
                className="focus-ring hidden min-h-10 items-center gap-1.5 rounded-full bg-action-secondary-bg px-4 type-button-sm text-action-secondary-fg hover:bg-action-secondary-bg-hover lg:inline-flex"
              >
                Ver mi sitio
                <IconExternalLink size={16} />
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            ) : null}
            {user?.boda ? (
              <AccountNotificationsBell
                items={notifications.items}
                unreadCount={notifications.unreadCount}
              />
            ) : null}
            <LogoutButton className="focus-ring inline-flex min-h-11 items-center rounded-full border border-border-default px-4 type-button-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary disabled:cursor-wait disabled:opacity-60" />
          </div>
        </div>
      </header>

      {user?.boda ? (
        <div className="border-b border-border-subtle bg-surface-default lg:hidden">
          <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <span className="flex min-w-0 items-center gap-2 type-body-sm text-text-secondary">
              <span className="sr-only">Micrositio: </span>
              <strong className="truncate font-semibold text-text-primary">
                {user.boda.title}
              </strong>
              {sidebarBoda ? <PlanBadge plan={sidebarBoda.plan} /> : null}
            </span>
            <div className="flex shrink-0 items-center gap-4 type-body-sm font-semibold">
              <Link
                href="/mi-cuenta/invitar"
                className="focus-ring inline-flex min-h-11 items-center rounded-sm text-text-accent hover:underline"
              >
                Invitar
              </Link>
              <a
                href={`/bodas/${user.boda.slug}`}
                target="_blank"
                rel="noopener"
                className="focus-ring inline-flex min-h-11 items-center rounded-sm text-text-link hover:underline"
              >
                Ver sitio <span aria-hidden="true">↗</span>
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[1320px] px-4 py-4 sm:px-6 lg:py-8">
        <div className="grid gap-0 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
          <AccountSidebar
            badges={
              Object.keys(sidebarBadges).length > 0 ? sidebarBadges : undefined
            }
            boda={sidebarBoda}
            email={user?.email}
          />
          <main id="contenido" tabIndex={-1} className="min-w-0 outline-none">
            <AccountBreadcrumb />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
