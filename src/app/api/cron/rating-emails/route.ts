import { NextResponse } from "next/server";
import { getCoupleDisplayName } from "@/data/bodas";
import {
  CRON_HEARTBEAT_IDS,
  recordCronHeartbeat,
} from "@/lib/admin/cron-heartbeat";
import { prisma } from "@/lib/db/prisma";
import { notifyRatingRequest } from "@/lib/email/notify";
import {
  hasEventDatePassed,
  parseEventDate,
} from "@/lib/ratings/date";
import type { Boda as BodaShape } from "@/types/boda";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const candidates = await prisma.boda.findMany({
      where: {
        ratingEmailSentAt: null,
        ratings: { none: {} },
      },
      select: {
        id: true,
        title: true,
        couple: true,
        event: true,
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 500,
    });

    const due = candidates.filter((boda) => hasEventDatePassed(boda.event));

    let queued = 0;
    for (const boda of due) {
      const email = boda.user.email;
      if (!email) continue;

      const coupleName =
        boda.user.name ||
        getCoupleDisplayName((boda.couple ?? {}) as BodaShape["couple"]) ||
        boda.title;

      const eventDate = parseEventDate(
        boda.event && typeof boda.event === "object" && "date" in boda.event
          ? (boda.event as { date?: unknown }).date
          : null,
      );

      // Evitar enviar el mismo día de la boda muy temprano: solo si ya pasó la fecha.
      if (!eventDate) continue;

      const result = await notifyRatingRequest({
        to: email,
        coupleName,
        bodaId: boda.id,
      });
      if (!result.skipped && !result.duplicate) queued += 1;
    }

    await recordCronHeartbeat(CRON_HEARTBEAT_IDS.ratingEmails, {
      candidates: candidates.length,
      due: due.length,
      queued,
    });

    return NextResponse.json({
      ok: true,
      candidates: candidates.length,
      due: due.length,
      queued,
    });
  } catch (error) {
    console.error("[cron/rating-emails]", error);
    return NextResponse.json(
      { error: "Failed to process rating emails" },
      { status: 500 },
    );
  }
}
