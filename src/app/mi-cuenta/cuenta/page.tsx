import { redirect } from "next/navigation";
import { AccountDeletionPanel } from "@/components/account/AccountDeletionPanel";
import { DELETION_CODE_PURPOSE } from "@/lib/account/deletion-code";
import { findPendingVerificationCode } from "@/lib/auth/verification-code";
import { isAdminRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

export default async function MiCuentaCuentaPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/mi-cuenta/cuenta");
  }

  const [{ messages }, user] = await Promise.all([
    getDictionary(),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        email: true,
        role: true,
      },
    }),
  ]);
  if (!user) {
    redirect("/login?next=/mi-cuenta/cuenta");
  }

  // Código de borrado todavía vigente: se retoma en el paso 2.
  const pending = await findPendingVerificationCode(prisma, {
    userId: session.userId,
    purpose: DELETION_CODE_PURPOSE,
  });
  const admin = isAdminRole(user.role);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-stone-800 sm:text-2xl">
          {t(messages, "accountDeletion.title")}
        </h2>
        <p className="mt-2 text-sm text-stone-600">{t(messages, "accountDeletion.lead")}</p>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-stone-500">{t(messages, "accountDeletion.emailLabel")}</p>
        <p className="mt-1 text-base font-medium text-stone-800">{user.email}</p>
      </section>

      {admin ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {t(messages, "accountDeletion.errorAdmin")}
        </p>
      ) : (
        <AccountDeletionPanel
          email={user.email}
          initialStep={pending ? "code" : "form"}
          initialResendAvailableAt={
            pending ? pending.resendAvailableAt.getTime() : undefined
          }
        />
      )}
    </div>
  );
}