import { prisma } from "@/lib/db/prisma";

export interface PanelNotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string;
  readAt: string | null;
  createdAt: string;
}

export async function getBodaNotifications(
  bodaId: string,
  limit = 20,
): Promise<{ items: PanelNotificationItem[]; unreadCount: number }> {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { bodaId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { bodaId, readAt: null },
    }),
  ]);

  return {
    unreadCount,
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      body: item.body,
      href: item.href,
      readAt: item.readAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}
