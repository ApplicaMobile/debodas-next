import Link from "next/link";
import {
  AdminBreadcrumb,
  AdminSidebar,
} from "@/components/admin/AdminSidebar";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const [pendingRatings, pendingGifts] = await Promise.all([
    prisma.rating.count({ where: { status: "pending" } }),
    prisma.confirmedGift.count({ where: { confirmed: false } }),
  ]);
  const badges = {
    ...(pendingRatings > 0
      ? { "/admin/calificaciones": pendingRatings }
      : {}),
    ...(pendingGifts > 0 ? { "/admin/pagos": pendingGifts } : {}),
  };

  return (
    <div className="min-h-screen bg-bg-canvas text-text-primary">
      <a
        href="#contenido"
        className="focus-ring sr-only z-[60] rounded-full bg-action-primary-bg px-4 py-2 type-button-sm text-action-primary-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface-default/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="focus-ring shrink-0 rounded-sm font-serif text-xl font-semibold text-text-primary"
            >
              DeBodas
              <span className="sr-only"> (ir al sitio principal)</span>
            </Link>
            <span
              aria-hidden="true"
              className="hidden h-6 w-px bg-border-default sm:block"
            />
            <div className="sr-only min-w-0 sm:not-sr-only sm:block">
              <h1 className="type-label text-text-primary">Panel admin</h1>
              <p className="truncate type-caption text-text-tertiary">
                {admin.email}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher compact variant="onLight" />
            <LogoutButton className="focus-ring inline-flex min-h-10 items-center rounded-full border border-border-default px-3 type-button-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary disabled:cursor-wait disabled:opacity-60 sm:px-4" />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:py-8">
        <div className="grid gap-0 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
          <AdminSidebar
            badges={Object.keys(badges).length > 0 ? badges : undefined}
            email={admin.email}
          />
          <main id="contenido" tabIndex={-1} className="min-w-0 outline-none">
            <AdminBreadcrumb />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
