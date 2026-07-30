import { NextResponse } from "next/server";
import { getMercadoPagoPayment } from "@/lib/mercadopago/api";
import {
  getMercadoPagoAccessToken,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago/config";
import {
  extractMercadoPagoDataId,
  getMercadoPagoWebhookSecret,
  isMercadoPagoWebhookStrict,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/mercadopago/webhook-signature";
import { getDecryptedPaymentSettings } from "@/lib/bodas/payment-settings";
import { processMercadoPagoPaymentNotification } from "@/lib/payments/process-payment";
import {
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { prisma } from "@/lib/db/prisma";

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

async function assertWebhookAllowed(
  request: Request,
  dataId: string | null,
): Promise<NextResponse | null> {
  const ip = clientIpFromHeaders(request.headers);
  const rate = await checkRateLimit(`mp-webhook:${ip}`, 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      },
    );
  }

  const secret = getMercadoPagoWebhookSecret();
  const isProd = process.env.NODE_ENV === "production";

  if (!secret && isProd && isMercadoPagoWebhookStrict()) {
    console.error(
      "[mercadopago webhook] MERCADOPAGO_WEBHOOK_SECRET requerido (STRICT)",
    );
    return NextResponse.json(
      { ok: false, error: "Webhook secret not configured" },
      { status: 503 },
    );
  }

  const check = verifyMercadoPagoWebhookSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
    secret,
  });

  if (!check.ok) {
    console.warn("[mercadopago webhook] firma rechazada:", check.reason);
    return NextResponse.json(
      { ok: false, error: "Invalid signature" },
      { status: 401 },
    );
  }

  if (check.mode === "skipped_no_secret" && isProd) {
    console.warn(
      "[mercadopago webhook] sin MERCADOPAGO_WEBHOOK_SECRET — configurá el secret del panel MP",
    );
  } else if (check.mode === "skipped_unsigned") {
    console.warn(
      "[mercadopago webhook] notificación sin x-signature (IPN / app de pareja)",
    );
  }

  return null;
}

async function handlePaymentNotification(
  paymentId: string,
  bodaId: string | null,
) {
  const accessToken = await resolveAccessToken(bodaId);
  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "MP not configured" },
      { status: 503 },
    );
  }

  try {
    const mpPayment = await getMercadoPagoPayment(paymentId, accessToken);
    const result = await processMercadoPagoPaymentNotification(mpPayment);
    return NextResponse.json({ ok: true, ...result });
  } catch (primaryError) {
    // Fallback: token de la app (pagos de plan) si el de la boda falló
    const platformToken = getMercadoPagoAccessToken();
    if (platformToken && platformToken !== accessToken) {
      const mpPayment = await getMercadoPagoPayment(paymentId, platformToken);
      const result = await processMercadoPagoPaymentNotification(mpPayment);
      return NextResponse.json({ ok: true, ...result });
    }
    throw primaryError;
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const bodaId = url.searchParams.get("bodaId");

  if (!bodaId && !isMercadoPagoConfigured()) {
    return NextResponse.json(
      { ok: false, error: "MP not configured" },
      { status: 503 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const dataId = extractMercadoPagoDataId(url, body);
  const denied = await assertWebhookAllowed(request, dataId);
  if (denied) {
    return denied;
  }

  const topic = String(
    body.type ?? body.topic ?? request.headers.get("x-topic") ?? "",
  ).trim();
  const paymentId = dataId;

  if (topic !== "payment" || !paymentId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    return await handlePaymentNotification(paymentId, bodaId);
  } catch (error) {
    console.error("[mercadopago webhook]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const topic = url.searchParams.get("topic") ?? url.searchParams.get("type");
  const paymentId = extractMercadoPagoDataId(url);
  const bodaId = url.searchParams.get("bodaId");

  if (!paymentId || topic !== "payment") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const denied = await assertWebhookAllowed(request, paymentId);
  if (denied) {
    return denied;
  }

  if (!bodaId && !isMercadoPagoConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    return await handlePaymentNotification(paymentId, bodaId);
  } catch (error) {
    console.error("[mercadopago webhook GET]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
