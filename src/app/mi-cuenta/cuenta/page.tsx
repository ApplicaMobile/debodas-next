import { redirect } from "next/navigation";
import { AccountDeletionPanel } from "@/components/account/AccountDeletionPanel";
import {
  AccountPageBody,
  AccountPageHeader,
  AccountSection,
} from "@/components/account/AccountPage";
import { Alert } from "@/components/ui";
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
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/cuenta"
        section="Cuenta"
        title={t(messages, "accountDeletion.title")}
        description={t(messages, "accountDeletion.lead")}
      />

      <AccountSection id="cuenta-acceso" title={t(messages, "accountDeletion.emailLabel")}>
        <p className="break-all type-body-lg font-semibold text-text-primary">{user.email}</p>
      </AccountSection>

      {admin ? (
        <Alert tone="pendiente" title={t(messages, "accountDeletion.errorAdmin")} />
      ) : (
        <AccountDeletionPanel
          email={user.email}
          initialStep={pending ? "code" : "form"}
          initialResendAvailableAt={
            pending ? pending.resendAvailableAt.getTime() : undefined
          }
        />
      )}
    </AccountPageBody>
  );
}
