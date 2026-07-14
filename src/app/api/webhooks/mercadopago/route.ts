import { NextResponse } from "next/server";
import { getMercadoPagoPayment } from "@/lib/mercadopago/api";
import { isMercadoPagoConfigured } from "@/lib/mercadopago/config";
import { processMercadoPagoPaymentNotification } from "@/lib/payments/process-plan-payment";

export async function POST(request: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ ok: false, error: "MP not configured" }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const topic =
    String(body.type ?? body.topic ?? request.headers.get("x-topic") ?? "").trim();
  const data = body.data as { id?: string | number } | undefined;
  const paymentId = data?.id ? String(data.id) : null;

  if (topic !== "payment" || !paymentId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const mpPayment = await getMercadoPagoPayment(paymentId);
    const result = await processMercadoPagoPaymentNotification(mpPayment);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[mercadopago webhook]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic") ?? searchParams.get("type");
  const paymentId = searchParams.get("id") ?? searchParams.get("data.id");

  if (!isMercadoPagoConfigured() || topic !== "payment" || !paymentId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const mpPayment = await getMercadoPagoPayment(paymentId);
    const result = await processMercadoPagoPaymentNotification(mpPayment);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[mercadopago webhook GET]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
