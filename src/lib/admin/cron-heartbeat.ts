import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const CRON_HEARTBEAT_IDS = {
  emailQueue: "cron:email-queue",
  ratingEmails: "cron:rating-emails",
  maintenance: "cron:maintenance",
} as const;

export type CronHeartbeatId =
  (typeof CRON_HEARTBEAT_IDS)[keyof typeof CRON_HEARTBEAT_IDS];

export async function recordCronHeartbeat(
  id: CronHeartbeatId,
  meta: Prisma.InputJsonValue = {},
): Promise<void> {
  const now = new Date();
  await prisma.systemHeartbeat.upsert({
    where: { id },
    create: {
      id,
      lastRunAt: now,
      meta,
    },
    update: {
      lastRunAt: now,
      meta,
    },
  });
}
