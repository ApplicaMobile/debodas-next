import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { requireAdmin } from "@/lib/admin/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#EBEBEB]">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <Link
              href="/"
              className="text-xs font-medium text-stone-500 hover:text-stone-800 sm:text-sm"
            >
              ← DeBodas
            </Link>
            <h1 className="mt-0.5 truncate font-serif text-xl font-semibold text-stone-800 sm:text-2xl">
              Panel admin
            </h1>
            <p className="truncate text-xs text-stone-500 sm:text-sm">
              {admin.email}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1800px] px-4 py-4 sm:px-6 sm:py-10">
        <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-6">
          <AdminSidebar />
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
