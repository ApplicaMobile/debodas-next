import { NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/email/worker";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const stats = await processEmailQueue(20);
    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    console.error("[cron/email-queue]", error);
    return NextResponse.json(
      { error: "Failed to process email queue" },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
