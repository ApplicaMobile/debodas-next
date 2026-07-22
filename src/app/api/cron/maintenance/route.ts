import { NextResponse } from "next/server";
import {
  CRON_HEARTBEAT_IDS,
  recordCronHeartbeat,
} from "@/lib/admin/cron-heartbeat";
import { runMaintenance } from "@/lib/maintenance/run";

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
    const stats = await runMaintenance();
    await recordCronHeartbeat(CRON_HEARTBEAT_IDS.maintenance, { ...stats });
    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    console.error("[cron/maintenance]", error);
    return NextResponse.json(
      { error: "Failed to run maintenance" },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
