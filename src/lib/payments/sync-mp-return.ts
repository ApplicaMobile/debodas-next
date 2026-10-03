import { getMercadoPagoPayment } from "@/lib/mercadopago/api";
import { getMercadoPagoAccessToken } from "@/lib/mercadopago/config";
import { getDecryptedPaymentSettings } from "@/lib/bodas/payment-settings";
import { processMercadoPagoPaymentNotification } from "@/lib/payments/process-payment";
import { prisma } from "@/lib/db/prisma";

function firstPaymentId(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const id = String(value ?? "").trim();
    if (/^\d+$/.test(id)) {
      return id;
    }
  }
  return null;
}

async function resolveAccessToken(bodaId: string | null): Promise<string | null> {
  if (bodaId) {
    const boda = await prisma.boda.findUnique({
      where: { id: bodaId },
      select: { misc: true },
    });
    if (boda) {
      const settings = getDecryptedPaymentSettings(
        boda.misc as Record<string, unknown>,
      );
      const token = settings.mp_tokens?.access_token?.trim();
      if (token) {
        return token;
      }
    }
  }

  return getMercadoPagoAccessToken();
}

/**
 * Completa un pago cuando el usuario vuelve del checkout.
 * En localhost el webhook de MP no llega; el return sí.
 */
export async function syncMercadoPagoReturn(input: {
  mpPaymentId?: string | null;
  collectionId?: string | null;
  externalRef?: string | null;
  bodaId?: string | null;
}): Promise<void> {
  const mpPaymentId = firstPaymentId(input.mpPaymentId, input.collectionId);
  if (!mpPaymentId) {
    return;
  }

  let bodaId = input.bodaId?.trim() || null;
  const externalRef = String(input.externalRef ?? "").trim();
  if (!bodaId && externalRef) {
    const local = await prisma.payment.findUnique({
      where: { externalRef },
      select: { bodaId: true },
    });
    bodaId = local?.bodaId ?? null;
  }

  const accessToken = await resolveAccessToken(bodaId);
  if (!accessToken) {
    return;
  }

  try {
    const mpPayment = await getMercadoPagoPayment(mpPaymentId, accessToken);
    if (
      externalRef &&
      mpPayment.external_reference &&
      mpPayment.external_reference !== externalRef
    ) {
      return;
    }
    await processMercadoPagoPaymentNotification(mpPayment);
  } catch (error) {
    console.error("[syncMercadoPagoReturn]", error);
  }
}
