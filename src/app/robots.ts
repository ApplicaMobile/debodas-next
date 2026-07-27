import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/email/client";

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/mi-cuenta",
          "/mi-cuenta/",
          "/admin",
          "/admin/",
          "/api/",
          "/acceso-denegado",
          "/recuperar",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
