import { NextResponse } from "next/server";
import { getCoupleDisplayName } from "@/data/bodas";
import { prisma } from "@/lib/db/prisma";
import { notifyRatingRequest, queueEmail } from "@/lib/email/notify";
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
      take: 50,
    });

    const due = candidates.filter((boda) => hasEventDatePassed(boda.event));

    let sent = 0;
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

      queueEmail(async () => {
        await notifyRatingRequest({
          to: email,
          coupleName,
          bodaId: boda.id,
        });
      });

      await prisma.boda.update({
        where: { id: boda.id },
        data: { ratingEmailSentAt: new Date() },
      });
      sent += 1;
    }

    return NextResponse.json({
      ok: true,
      candidates: candidates.length,
      due: due.length,
      sent,
    });
  } catch (error) {
    console.error("[cron/rating-emails]", error);
    return NextResponse.json(
      { error: "Failed to process rating emails" },
      { status: 500 },
    );
  }
}
