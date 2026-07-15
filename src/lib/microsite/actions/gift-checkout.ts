"use server";

import { revalidatePath } from "next/cache";
import {
  getAvailableGiftPaymentMethods,
  getPaymentSettings,
  hasMpCheckout,
} from "@/lib/bodas/payment-settings";
import { GIFT_PAYMENT_METHODS } from "@/lib/payments/constants";
import {
  applyMpSurcharge,
  calculateGiftSubtotal,
  type GiftCartLine,
} from "@/lib/payments/gift-pricing";
import {
  createMercadoPagoPreference,
  MercadoPagoApiError,
} from "@/lib/mercadopago/api";
import { getAppBaseUrl, getMercadoPagoWebhookUrl } from "@/lib/mercadopago/config";
import { prisma } from "@/lib/db/prisma";
import {
  getUploadErrorMessage,
  saveUploadedVoucher,
} from "@/lib/upload/local";

export interface GiftCheckoutState {
  error?: string;
  redirectTo?: string;
  success?: string;
}

interface ParsedCartItem {
  giftId: string;
  quantity: number;
}

function parseCartItems(raw: string): ParsedCartItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const record = item as Record<string, unknown>;
        const giftId = String(record.giftId ?? "").trim();
        const quantity = Number(record.quantity ?? 1);
        if (!giftId || !Number.isFinite(quantity) || quantity < 1) {
          return null;
        }
        return { giftId, quantity: Math.floor(quantity) };
      })
      .filter((item): item is ParsedCartItem => item !== null);
  } catch {
    return [];
  }
}

async function buildCartLines(
  bodaId: string,
  cartItems: ParsedCartItem[],
): Promise<GiftCartLine[] | { error: string }> {
  const giftIds = cartItems.map((item) => item.giftId);
  const gifts = await prisma.gift.findMany({
    where: { bodaId, id: { in: giftIds } },
  });

  if (gifts.length !== cartItems.length) {
    return { error: "Uno o más regalos ya no están disponibles." };
  }

  const giftById = new Map(gifts.map((gift) => [gift.id, gift]));

  return cartItems.map((item) => {
    const gift = giftById.get(item.giftId)!;
    return {
      giftId: gift.id,
      title: gift.title,
      unitPrice: Number(gift.price),
      quantity: item.quantity,
    };
  });
}

function readCheckoutFields(formData: FormData) {
  return {
    slug: String(formData.get("boda_slug") ?? "").trim(),
    participants: String(formData.get("participants") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    dedication: String(formData.get("dedication") ?? "").trim(),
    method: String(formData.get("method") ?? "").trim(),
    cartRaw: String(formData.get("cart_items") ?? "").trim(),
  };
}

function validateCheckoutFields(fields: ReturnType<typeof readCheckoutFields>) {
  if (!fields.slug) {
    return "No encontramos esta boda.";
  }
  if (fields.participants.length < 2) {
    return "Ingresá quién/es regala/n.";
  }
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return "Ingresá un email válido o dejá el campo vacío.";
  }
  return null;
}

export async function createGiftCheckoutAction(
  _prev: GiftCheckoutState,
  formData: FormData,
): Promise<GiftCheckoutState> {
  const fields = readCheckoutFields(formData);
  const validationError = validateCheckoutFields(fields);
  if (validationError) {
    return { error: validationError };
  }

  if (fields.method !== GIFT_PAYMENT_METHODS.MP_CHECKOUT) {
    return { error: "Método de pago no válido para checkout online." };
  }

  const cartItems = parseCartItems(fields.cartRaw);
  if (cartItems.length === 0) {
    return { error: "Agregá al menos un regalo al carrito." };
  }

  try {
    const boda = await prisma.boda.findUnique({
      where: { slug: fields.slug },
      select: { id: true, slug: true, plan: true, misc: true },
    });

    if (!boda) {
      return { error: "No encontramos esta boda." };
    }

    const settings = getPaymentSettings(boda.misc as Record<string, unknown>);
    const availableMethods = getAvailableGiftPaymentMethods(settings, boda.plan);
    if (!availableMethods.includes(GIFT_PAYMENT_METHODS.MP_CHECKOUT)) {
      return {
        error:
          "MercadoPago checkout no está habilitado. La pareja debe configurar sus credenciales.",
      };
    }

    if (!hasMpCheckout(settings)) {
      return { error: "MercadoPago no está configurado para esta boda." };
    }

    const accessToken = settings.mp_tokens!.access_token!.trim();
    const cartLines = await buildCartLines(boda.id, cartItems);
    if ("error" in cartLines) {
      return { error: cartLines.error };
    }

    const subtotal = calculateGiftSubtotal(cartLines);
    const externalRef = `gift_${boda.id}_${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        bodaId: boda.id,
        type: "gift",
        amount: subtotal,
        currency: "ARS",
        status: "pending",
        externalRef,
        payerEmail: fields.email || null,
        metadata: {
          participants: fields.participants,
          email: fields.email,
          phone: fields.phone,
          dedication: fields.dedication,
          method: GIFT_PAYMENT_METHODS.MP_CHECKOUT,
          items: cartLines,
        } as object,
      },
    });

    const baseUrl = getAppBaseUrl();
    const preference = await createMercadoPagoPreference({
      accessToken,
      externalReference: payment.externalRef,
      items: cartLines.map((item) => ({
        title: `${item.title} · DeBodas`,
        quantity: item.quantity,
        unit_price: applyMpSurcharge(item.unitPrice),
      })),
      payerEmail: fields.email || undefined,
      backUrls: {
        success: `${baseUrl}/bodas/${boda.slug}/regalo/gracias?ref=${payment.externalRef}&status=success`,
        failure: `${baseUrl}/bodas/${boda.slug}/regalo/gracias?ref=${payment.externalRef}&status=failure`,
        pending: `${baseUrl}/bodas/${boda.slug}/regalo/gracias?ref=${payment.externalRef}&status=pending`,
      },
      notificationUrl: getMercadoPagoWebhookUrl(boda.id),
      metadata: {
        payment_id: payment.id,
        boda_id: boda.id,
        type: "gift",
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { mpPreferenceId: preference.id },
    });

    return { redirectTo: preference.initPoint };
  } catch (err) {
    console.error("[createGiftCheckoutAction]", err);
    if (err instanceof MercadoPagoApiError) {
      return { error: err.message };
    }
    return { error: "No se pudo iniciar el pago con MercadoPago." };
  }
}

export async function submitGiftTransferAction(
  _prev: GiftCheckoutState,
  formData: FormData,
): Promise<GiftCheckoutState> {
  const fields = readCheckoutFields(formData);
  const validationError = validateCheckoutFields(fields);
  if (validationError) {
    return { error: validationError };
  }

  const transferMethods = new Set<string>([
    GIFT_PAYMENT_METHODS.BANK_TRANSFER_ARS,
    GIFT_PAYMENT_METHODS.BANK_TRANSFER_USD,
    GIFT_PAYMENT_METHODS.MP_TRANSFER,
    GIFT_PAYMENT_METHODS.PAYPAL,
  ]);

  if (!transferMethods.has(fields.method)) {
    return { error: "Seleccioná un método de pago válido." };
  }

  const cartItems = parseCartItems(fields.cartRaw);
  if (cartItems.length === 0) {
    return { error: "Agregá al menos un regalo al carrito." };
  }

  const voucher = formData.get("voucher");
  const voucherFile = voucher instanceof File && voucher.size > 0 ? voucher : null;

  try {
    const boda = await prisma.boda.findUnique({
      where: { slug: fields.slug },
      select: { id: true, slug: true, plan: true, misc: true },
    });

    if (!boda) {
      return { error: "No encontramos esta boda." };
    }

    const settings = getPaymentSettings(boda.misc as Record<string, unknown>);
    const availableMethods = getAvailableGiftPaymentMethods(settings, boda.plan);
    if (!availableMethods.includes(fields.method)) {
      return { error: "Este método de pago no está disponible." };
    }

    const cartLines = await buildCartLines(boda.id, cartItems);
    if ("error" in cartLines) {
      return { error: cartLines.error };
    }

    const amount = calculateGiftSubtotal(cartLines);
    let voucherUrl: string | null = null;

    if (voucherFile) {
      voucherUrl = await saveUploadedVoucher(
        voucherFile,
        `bodas/${boda.slug}/vouchers`,
      );
    }

    await prisma.confirmedGift.create({
      data: {
        bodaId: boda.id,
        participants: fields.participants,
        email: fields.email || null,
        phone: fields.phone || null,
        dedication: fields.dedication || null,
        method: fields.method,
        amount,
        currency:
          fields.method === GIFT_PAYMENT_METHODS.BANK_TRANSFER_USD ? "USD" : "ARS",
        items: cartLines as object[],
        voucherUrl,
        confirmed: false,
      },
    });

    revalidatePath("/mi-cuenta/regalos-recibidos");
    revalidatePath(`/bodas/${boda.slug}/regalo/gracias`);

    return {
      redirectTo: `/bodas/${boda.slug}/regalo/gracias?method=${encodeURIComponent(fields.method)}&transfer=1`,
    };
  } catch (err) {
    console.error("[submitGiftTransferAction]", err);
    return { error: getUploadErrorMessage(err) };
  }
}

export async function confirmReceivedGiftAction(
  _prev: { error?: string; success?: string },
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const giftId = String(formData.get("gift_id") ?? "").trim();
  if (!giftId) {
    return { error: "Regalo no válido." };
  }

  try {
    const gift = await prisma.confirmedGift.findUnique({
      where: { id: giftId },
      include: { boda: { select: { userId: true, slug: true } } },
    });

    if (!gift) {
      return { error: "No encontramos el regalo." };
    }

    const session = await import("@/lib/auth/session").then((m) => m.getSession());
    if (!session) {
      return { error: "Tenés que iniciar sesión." };
    }

    const ownedBoda = await prisma.boda.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!ownedBoda || ownedBoda.id !== gift.bodaId) {
      return { error: "No tenés permiso para confirmar este regalo." };
    }

    await prisma.confirmedGift.update({
      where: { id: giftId },
      data: { confirmed: true },
    });

    revalidatePath("/mi-cuenta/regalos-recibidos");
    return { success: "Regalo marcado como confirmado." };
  } catch (err) {
    console.error("[confirmReceivedGiftAction]", err);
    return { error: "No se pudo confirmar el regalo." };
  }
}
