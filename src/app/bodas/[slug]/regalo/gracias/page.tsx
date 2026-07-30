import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoupleDisplayName } from "@/data/bodas";
import { getBodaBySlug } from "@/lib/bodas/queries";
import { prisma } from "@/lib/db/prisma";

interface GiftThankYouPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    ref?: string;
    status?: string;
    transfer?: string;
    method?: string;
  }>;
}

type ThankYouKind = "success" | "pending" | "failure" | "transfer";

function resolveThankYou(input: {
  transfer?: string;
  status?: string;
  paymentStatus?: string | null;
}): { kind: ThankYouKind; message: string; title: string } {
  if (input.transfer === "1") {
    return {
      kind: "transfer",
      title: "¡Gracias!",
      message:
        "Registramos tu regalo. Realizá la transferencia según las instrucciones y, si subiste comprobante, los novios lo revisarán pronto.",
    };
  }

  const status = input.status?.trim();
  const paymentStatus = input.paymentStatus?.trim();

  if (
    status === "success" ||
    status === "approved" ||
    paymentStatus === "approved"
  ) {
    return {
      kind: "success",
      title: "¡Pago recibido!",
      message:
        "Recibimos tu pago. Los novios verán tu regalo en su panel. ¡Gracias!",
    };
  }

  if (
    status === "failure" ||
    status === "rejected" ||
    paymentStatus === "rejected"
  ) {
    return {
      kind: "failure",
      title: "No se completó el pago",
      message:
        "El pago no se completó. Podés volver al micrositio e intentarlo de nuevo desde la lista de regalos.",
    };
  }

  if (
    status === "pending" ||
    paymentStatus === "pending" ||
    paymentStatus === "in_process"
  ) {
    return {
      kind: "pending",
      title: "Pago pendiente",
      message:
        "Tu pago está pendiente. Te avisaremos cuando Mercado Pago lo confirme.",
    };
  }

  return {
    kind: "success",
    title: "¡Gracias!",
    message: "Registramos tu regalo. Los novios lo verán en su panel.",
  };
}

const kindStyles: Record<
  ThankYouKind,
  { badge: string; badgeText: string; iconBg: string; icon: string }
> = {
  success: {
    badge: "bg-emerald-50 text-emerald-800",
    badgeText: "Confirmado",
    iconBg: "bg-emerald-100 text-emerald-800",
    icon: "✓",
  },
  transfer: {
    badge: "bg-sky-50 text-sky-800",
    badgeText: "Transferencia",
    iconBg: "bg-sky-100 text-sky-800",
    icon: "↗",
  },
  pending: {
    badge: "bg-amber-50 text-amber-900",
    badgeText: "Pendiente",
    iconBg: "bg-amber-100 text-amber-900",
    icon: "…",
  },
  failure: {
    badge: "bg-red-50 text-red-800",
    badgeText: "No completado",
    iconBg: "bg-red-100 text-red-800",
    icon: "!",
  },
};

export default async function GiftThankYouPage({
  params,
  searchParams,
}: GiftThankYouPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const boda = await getBodaBySlug(slug);

  if (!boda) {
    notFound();
  }

  let paymentStatus: string | null = null;
  if (query.ref) {
    const payment = await prisma.payment.findUnique({
      where: { externalRef: query.ref },
      select: { status: true },
    });
    paymentStatus = payment?.status ?? null;
  }

  const resolved = resolveThankYou({
    transfer: query.transfer,
    status: query.status,
    paymentStatus,
  });
  const styles = kindStyles[resolved.kind];
  const coupleName = getCoupleDisplayName(boda.couple);

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-10 sm:px-6 sm:py-16">
      <div className="absolute inset-0 bg-[#f7f3eb]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(230,218,199,0.9),transparent_40%),radial-gradient(circle_at_90%_85%,rgba(6,38,58,0.07),transparent_40%)]" />

      <div className="relative mx-auto w-full max-w-xl">
        <p className="text-center font-serif text-2xl font-semibold tracking-tight text-stone-800 sm:text-3xl">
          {coupleName}
        </p>
        <p className="mt-1 text-center text-xs uppercase tracking-[0.18em] text-stone-500">
          Regalo · DeBodas
        </p>

        <div className="mt-6 rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-[0_20px_60px_rgba(45,45,45,0.08)] sm:mt-8 sm:rounded-3xl sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold sm:h-12 sm:w-12 ${styles.iconBg}`}
              aria-hidden
            >
              {styles.icon}
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles.badge}`}
            >
              {styles.badgeText}
            </span>
          </div>

          <h1 className="mt-5 font-serif text-[1.75rem] font-semibold leading-tight text-stone-800 sm:text-3xl">
            {resolved.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:mt-4 sm:text-[0.95rem]">
            {resolved.message}
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            {resolved.kind === "failure" ? (
              <Link
                href={`/bodas/${slug}#regalos`}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-[#d4c4a8]"
              >
                Reintentar en la lista de regalos
              </Link>
            ) : null}
            <Link
              href={`/bodas/${slug}`}
              className={
                resolved.kind === "failure"
                  ? "inline-flex min-h-11 items-center justify-center rounded-full border border-stone-200 px-5 py-2.5 text-sm font-medium text-stone-700"
                  : "inline-flex min-h-11 items-center justify-center rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-[#d4c4a8]"
              }
            >
              Volver al micrositio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
