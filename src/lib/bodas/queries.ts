import { getMockBodaBySlug } from "@/data/bodas";
import { mapBodaFromDb } from "@/lib/bodas/mapper";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { PUBLIC_OWNER_WHERE } from "@/lib/account/status";
import {
  MICROSITE_ACCESS_SELECT,
  micrositeAccessFor,
} from "@/lib/bodas/microsite-access";
import type { Boda } from "@/types/boda";

const bodaInclude = {
  gifts: true,
  pictures: true,
  scheduleItems: true,
  faqItems: true,
} as const;

export interface MicrositeBodaResult {
  boda: Boda;
  /** "preview": micrositio offline visto por su dueño o un admin. */
  access: "public" | "preview";
}

function mockResult(slug: string): MicrositeBodaResult | null {
  const mock = getMockBodaBySlug(slug);
  return mock ? { boda: mock, access: "public" } : null;
}

/**
 * Boda para el micrositio público respetando estado de cuenta e `isOnline`:
 * cuentas suspendidas/eliminadas no se ven; offline solo lo ven el dueño y los admins.
 */
export async function getMicrositeBoda(slug: string): Promise<MicrositeBodaResult | null> {
  if (!isDatabaseConfigured()) {
    return mockResult(slug);
  }

  try {
    const row = await prisma.boda.findUnique({
      where: { slug },
      include: { ...bodaInclude, user: MICROSITE_ACCESS_SELECT.user },
    });

    if (row) {
      const access = await micrositeAccessFor(row);
      return access === "hidden" ? null : { boda: mapBodaFromDb(row), access };
    }
  } catch (error) {
    console.error("[getBodaBySlug] Error leyendo MariaDB:", error);
  }

  return mockResult(slug);
}

export async function getBodaBySlug(slug: string): Promise<Boda | null> {
  return (await getMicrositeBoda(slug))?.boda ?? null;
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

export interface HomeWeddingCard {
  slug: string;
  title: string;
  imageUrl: string | null;
  coupleLabel: string;
}

function coupleLabel(couple: unknown, fallback: string): string {
  if (!couple || typeof couple !== "object") {
    return fallback;
  }
  const data = couple as Record<string, unknown>;
  const a = String(data.bride_name ?? data.bride ?? "").trim();
  const b = String(data.groom_name ?? data.groom ?? "").trim();
  const joined = [a, b].filter(Boolean).join(" & ");
  return joined || fallback;
}

export async function getOnlineWeddingsForHome(
  limit = 8,
): Promise<HomeWeddingCard[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const rows = await prisma.boda.findMany({
      where: {
        isOnline: true,
        slug: { not: "demo" },
        user: PUBLIC_OWNER_WHERE,
      },
      select: {
        slug: true,
        title: true,
        featuredImageUrl: true,
        couple: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      imageUrl: row.featuredImageUrl,
      coupleLabel: coupleLabel(row.couple, row.title),
    }));
  } catch (error) {
    console.error("[getOnlineWeddingsForHome]", error);
    return [];
  }
}
