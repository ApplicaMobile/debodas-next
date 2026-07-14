import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import type { MercadoPagoPaymentResult } from "@/lib/mercadopago/api";

const APPROVED_STATUSES = new Set(["approved"]);
const REJECTED_STATUSES = new Set(["rejected", "cancelled", "refunded", "charged_back"]);

function mapPaymentStatus(mpStatus: string): string {
  if (APPROVED_STATUSES.has(mpStatus)) {
    return "approved";
  }
  if (REJECTED_STATUSES.has(mpStatus)) {
    return "rejected";
  }
  return "pending";
}

export async function processMercadoPagoPaymentNotification(
  mpPayment: MercadoPagoPaymentResult,
): Promise<{ handled: boolean; message: string }> {
  const externalRef = mpPayment.external_reference?.trim();
  if (!externalRef) {
    return { handled: false, message: "Pago sin external_reference." };
  }

  const payment = await prisma.payment.findUnique({
    where: { externalRef },
    include: { boda: { select: { id: true, slug: true, plan: true } } },
  });

  if (!payment) {
    return { handled: false, message: "Pago local no encontrado." };
  }

  if (payment.status === "approved") {
    return { handled: true, message: "Pago ya procesado." };
  }

  const nextStatus = mapPaymentStatus(mpPayment.status);
  const mpPaymentId = String(mpPayment.id);

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: nextStatus,
      mpPaymentId,
      payerEmail: mpPayment.payer?.email ?? payment.payerEmail,
    },
  });

  if (nextStatus === "approved" && payment.type === "plan" && payment.planTarget) {
    await prisma.boda.update({
      where: { id: payment.bodaId },
      data: { plan: payment.planTarget },
    });

    revalidatePath("/mi-cuenta/plan");
    revalidatePath("/mi-cuenta");
    revalidatePath(`/bodas/${payment.boda.slug}`);

    return {
      handled: true,
      message: `Plan actualizado a ${payment.planTarget}.`,
    };
  }

  return {
    handled: true,
    message: `Pago registrado con estado ${nextStatus}.`,
  };
}
