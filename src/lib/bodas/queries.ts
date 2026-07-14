import { getMockBodaBySlug } from "@/data/bodas";
import { mapBodaFromDb } from "@/lib/bodas/mapper";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import type { Boda } from "@/types/boda";

const bodaInclude = {
  gifts: true,
  pictures: true,
  scheduleItems: true,
  faqItems: true,
} as const;

export async function getBodaBySlug(slug: string): Promise<Boda | null> {
  if (!isDatabaseConfigured()) {
    return getMockBodaBySlug(slug);
  }

  try {
    const row = await prisma.boda.findUnique({
      where: { slug },
      include: bodaInclude,
    });

    if (row) {
      return mapBodaFromDb(row);
    }
  } catch (error) {
    console.error("[getBodaBySlug] Error leyendo MariaDB:", error);
  }

  return getMockBodaBySlug(slug);
}

export async function getBodaRsvpCount(slug: string): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }

  try {
    const boda = await prisma.boda.findUnique({
      where: { slug },
      select: {
        _count: { select: { rsvpGuests: true } },
      },
    });

    return boda?._count.rsvpGuests ?? 0;
  } catch (error) {
    console.error("[getBodaRsvpCount]", error);
    return 0;
  }
}
