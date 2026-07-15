import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { MercadoPagoPaymentResult } from "@/lib/mercadopago/api";

const APPROVED_STATUSES = new Set(["approved"]);
const REJECTED_STATUSES = new Set([
  "rejected",
  "cancelled",
  "refunded",
  "charged_back",
]);

function mapPaymentStatus(mpStatus: string): string {
  if (APPROVED_STATUSES.has(mpStatus)) {
    return "approved";
  }
  if (REJECTED_STATUSES.has(mpStatus)) {
    return "rejected";
  }
  return "pending";
}

interface GiftPaymentMetadata {
  participants?: string;
  email?: string;
  phone?: string;
  dedication?: string;
  method?: string;
  items?: Array<{
    giftId: string;
    title: string;
    unitPrice: number;
    quantity: number;
  }>;
}

async function createConfirmedGiftFromPayment(payment: {
  id: string;
  bodaId: string;
  amount: Prisma.Decimal;
  metadata: unknown;
}): Promise<void> {
  const existing = await prisma.confirmedGift.findUnique({
    where: { paymentId: payment.id },
  });
  if (existing) {
    return;
  }

  const meta = (payment.metadata ?? {}) as GiftPaymentMetadata;
  const items = Array.isArray(meta.items) ? meta.items : [];

  await prisma.confirmedGift.create({
    data: {
      bodaId: payment.bodaId,
      paymentId: payment.id,
      participants: meta.participants ?? "Invitado",
      email: meta.email ?? null,
      phone: meta.phone ?? null,
      dedication: meta.dedication ?? null,
      method: meta.method ?? "mp_checkout",
      amount: payment.amount,
      currency: "ARS",
      items,
      confirmed: true,
    },
  });
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

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: nextStatus,
      mpPaymentId,
      payerEmail: mpPayment.payer?.email ?? payment.payerEmail,
      ...(typeof mpPayment.transaction_amount === "number"
        ? { amount: mpPayment.transaction_amount }
        : {}),
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

  if (nextStatus === "approved" && payment.type === "gift") {
    await createConfirmedGiftFromPayment(updatedPayment);

    revalidatePath(`/bodas/${payment.boda.slug}`);
    revalidatePath("/mi-cuenta/regalos-recibidos");

    return {
      handled: true,
      message: "Regalo confirmado.",
    };
  }

  return {
    handled: true,
    message: `Pago registrado con estado ${nextStatus}.`,
  };
}
