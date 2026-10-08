import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { EmailVerificationPanel } from "@/components/auth/EmailVerificationPanel";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { isAccountActive } from "@/lib/account/status";
import { EMAIL_VERIFICATION_PURPOSE, pendingSignupPlan } from "@/lib/auth/email-verification";
import { isAdminRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { findPendingVerificationCode } from "@/lib/auth/verification-code";
import { prisma } from "@/lib/db/prisma";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

export default async function VerificarEmailPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/registro/verificar");
  }

  const [{ messages }, user] = await Promise.all([
    getDictionary(),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        email: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        boda: { select: { misc: true } },
      },
    }),
  ]);
  if (!user || !isAccountActive(user.status)) {
    redirect("/login");
  }
  if (user.emailVerifiedAt || isAdminRole(user.role)) {
    redirect(isAdminRole(user.role) ? "/" : "/mi-cuenta");
  }

  const pending = await findPendingVerificationCode(prisma, {
    userId: session.userId,
    purpose: EMAIL_VERIFICATION_PURPOSE,
  });
  const paidPlan = pendingSignupPlan(user.boda?.misc);

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen overflow-hidden bg-[#EBEBEB] pt-24 pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(230,218,199,0.75),transparent_40%),radial-gradient(circle_at_10%_85%,rgba(6,38,58,0.07),transparent_45%)]" />
        <div className="relative mx-auto max-w-lg rounded-3xl bg-white p-6 shadow-xl sm:p-12">
          <p className="font-serif text-2xl font-semibold tracking-tight text-stone-800">DeBodas</p>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            {t(messages, "emailVerification.title")}
          </h1>
          <p className="mt-4 break-words text-stone-600">
            {t(messages, "emailVerification.lead", { email: user.email })}
          </p>
          <p className="mt-2 text-sm text-stone-500">{t(messages, "emailVerification.spamHint")}</p>
          {paidPlan ? (
            <p className="mt-4 rounded-xl bg-[#f4edcc] px-4 py-3 text-sm text-[#6f5f47]">
              {t(messages, "emailVerification.paidPlanNote")}
            </p>
          ) : null}

          <EmailVerificationPanel
            hasPendingCode={Boolean(pending)}
            initialResendAvailableAt={pending ? pending.resendAvailableAt.getTime() : undefined}
          />

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-6 text-sm text-stone-500">
            <span>{t(messages, "emailVerification.wrongEmail")}</span>
            <LogoutButton />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}