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
