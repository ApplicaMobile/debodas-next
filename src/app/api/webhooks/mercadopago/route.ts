import { NextResponse } from "next/server";
import { getMercadoPagoPayment } from "@/lib/mercadopago/api";
import {
  getMercadoPagoAccessToken,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago/config";
import { getPaymentSettings } from "@/lib/bodas/payment-settings";
import { processMercadoPagoPaymentNotification } from "@/lib/payments/process-payment";
import { prisma } from "@/lib/db/prisma";

async function resolveAccessToken(bodaId: string | null): Promise<string | null> {
  if (bodaId) {
    const boda = await prisma.boda.findUnique({
      where: { id: bodaId },
      select: { misc: true },
    });
    if (boda) {
      const settings = getPaymentSettings(boda.misc as Record<string, unknown>);
      const token = settings.mp_tokens?.access_token?.trim();
      if (token) {
        return token;
      }
    }
  }

  return getMercadoPagoAccessToken();
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
  const { searchParams } = new URL(request.url);
  const bodaId = searchParams.get("bodaId");

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

  const topic = String(
    body.type ?? body.topic ?? request.headers.get("x-topic") ?? "",
  ).trim();
  const data = body.data as { id?: string | number } | undefined;
  const paymentId = data?.id ? String(data.id) : null;

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
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic") ?? searchParams.get("type");
  const paymentId = searchParams.get("id") ?? searchParams.get("data.id");
  const bodaId = searchParams.get("bodaId");

  if (!paymentId || topic !== "payment") {
    return NextResponse.json({ ok: true, skipped: true });
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
