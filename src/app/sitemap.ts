import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/email/client";
import { PUBLIC_OWNER_WHERE } from "@/lib/account/status";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { micrositeRequiresPassword } from "@/lib/microsite/password";

// Se arma en cada request (las bodas online cambian y en el build puede no haber BD).
export const dynamic = "force-dynamic";

/** Micrositios online y sin contraseña (los protegidos no aportan a Google). */
async function onlineBodaRoutes(base: string): Promise<MetadataRoute.Sitemap> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  try {
    const rows = await prisma.boda.findMany({
      where: { isOnline: true, slug: { not: "demo" }, user: PUBLIC_OWNER_WHERE },
      select: { slug: true, updatedAt: true, options: true },
      orderBy: { createdAt: "desc" },
    });
    return rows
      .filter((row) => !micrositeRequiresPassword(row.options))
      .map((row) => ({
        url: `${base}/bodas/${encodeURIComponent(row.slug)}`,
        lastModified: row.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
  } catch (error) {
    console.error("[sitemap] bodas online", error instanceof Error ? error.message : error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();
  const now = new Date();

  const staticRoutes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/registro", changeFrequency: "monthly", priority: 0.9 },
    { path: "/login", changeFrequency: "monthly", priority: 0.5 },
    { path: "/bodas/demo", changeFrequency: "weekly", priority: 0.8 },
    { path: "/quienes-somos", changeFrequency: "monthly", priority: 0.7 },
    { path: "/contacto", changeFrequency: "monthly", priority: 0.7 },
    { path: "/terminos", changeFrequency: "yearly", priority: 0.3 },
    { path: "/privacidad", changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...(await onlineBodaRoutes(base)),
  ];
}
