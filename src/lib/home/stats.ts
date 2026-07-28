import { prisma } from "@/lib/db/prisma";

export interface HomeSocialProof {
  weddingCount: number;
  reviewCount: number;
  averageScore: number | null;
}

export async function getHomeSocialProof(): Promise<HomeSocialProof> {
  try {
    const [weddingCount, ratingAgg] = await Promise.all([
      prisma.boda.count(),
      prisma.rating.aggregate({
        where: { status: "approved" },
        _avg: { score: true },
        _count: { _all: true },
      }),
    ]);

    return {
      weddingCount,
      reviewCount: ratingAgg._count._all,
      averageScore: ratingAgg._avg.score
        ? Math.round(ratingAgg._avg.score * 10) / 10
        : null,
    };
  } catch (error) {
    console.error("[getHomeSocialProof]", error);
    return {
      weddingCount: 0,
      reviewCount: 0,
      averageScore: null,
    };
  }
}
