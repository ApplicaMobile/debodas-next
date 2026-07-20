import { prisma } from "@/lib/db/prisma";

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

    return ratings
      .filter((r) => r.comment && r.comment.trim().length > 0)
      .map((r) => ({
        name: r.name,
        rating: r.score,
        comment: r.comment!.trim(),
      }));
  } catch (error) {
    console.error("[getApprovedHomeReviews]", error);
    return [];
  }
}
