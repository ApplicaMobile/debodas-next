import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/email/client";

export default function sitemap(): MetadataRoute.Sitemap {
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

  return staticRoutes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
