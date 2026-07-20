import Link from "next/link";
import { notFound } from "next/navigation";
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

function resolveThankYouMessage(input: {
  transfer?: string;
  status?: string;
  paymentStatus?: string | null;
}): string {
  if (input.transfer === "1") {
    return "¡Gracias! Registramos tu regalo. Realizá la transferencia según las instrucciones y, si subiste comprobante, los novios lo revisarán pronto.";
  }

  const status = input.status?.trim();
  const paymentStatus = input.paymentStatus?.trim();

  if (
    status === "success" ||
    status === "approved" ||
    paymentStatus === "approved"
  ) {
    return "¡Gracias! Recibimos tu pago. Los novios verán tu regalo en su panel.";
  }

  if (
    status === "failure" ||
    status === "rejected" ||
    paymentStatus === "rejected"
  ) {
    return "El pago no se completó. Podés volver al micrositio e intentarlo de nuevo.";
  }

  if (
    status === "pending" ||
    paymentStatus === "pending" ||
    paymentStatus === "in_process"
  ) {
    return "Tu pago está pendiente. Te avisaremos cuando Mercado Pago lo confirme.";
  }

  return "¡Gracias! Registramos tu regalo. Los novios lo verán en su panel.";
}

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

  const message = resolveThankYouMessage({
    transfer: query.transfer,
    status: query.status,
    paymentStatus,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-stone-500">Regalo</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-stone-800">
          ¡Gracias!
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">{message}</p>
        <Link
          href={`/bodas/${slug}`}
          className="mt-8 inline-flex rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800"
        >
          Volver al micrositio
        </Link>
      </div>
    </main>
  );
}
