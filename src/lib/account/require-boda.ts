import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { BodaCouple, BodaEvent } from "@/types/boda";

const bodaInclude = {
  gifts: true,
  pictures: true,
  scheduleItems: true,
  faqItems: true,
  rsvpGuests: true,
} as const;

export async function getOwnedBoda() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  return prisma.boda.findUnique({
    where: { userId: session.userId },
    include: bodaInclude,
  });
}

export function parseCouple(value: unknown): BodaCouple {
  if (value && typeof value === "object") {
    return value as BodaCouple;
  }
  return {};
}

export function parseEvent(value: unknown): BodaEvent {
  if (value && typeof value === "object") {
    return value as BodaEvent;
  }
  return {};
}

export function parseMisc(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}
