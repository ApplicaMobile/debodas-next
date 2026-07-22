import { prisma } from "@/lib/db/prisma";
import { reviews as fallbackReviews } from "@/data/home";

export async function getApprovedHomeReviews(limit = 6) {
  try {
    const ratings = await prisma.rating.findMany({
      where: { status: "approved" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        name: true,
        score: true,
        comment: true,
      },
    });

    const fromDb = ratings
      .filter((r) => r.comment && r.comment.trim().length > 0)
      .map((r) => ({
        name: r.name,
        rating: r.score,
        comment: r.comment!.trim(),
      }));

    if (fromDb.length > 0) {
      return fromDb;
    }
  } catch (error) {
    console.error("[getApprovedHomeReviews]", error);
  }

  return fallbackReviews.slice(0, limit);
}
