import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR?.trim() || ".next",
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "test.debodas.com.ar",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "debodas.com.ar",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    const headers = [...securityHeaders];
    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }
    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/boda/:slug", destination: "/bodas/:slug", permanent: true },
      { source: "/home-nueva", destination: "/", permanent: true },
      { source: "/login/", destination: "/login", permanent: true },
      { source: "/registro/", destination: "/registro", permanent: true },
      { source: "/mi-cuenta/", destination: "/mi-cuenta", permanent: true },
      { source: "/checkout", destination: "/mi-cuenta/plan", permanent: true },
      { source: "/checkout/", destination: "/mi-cuenta/plan", permanent: true },
      { source: "/carrito", destination: "/mi-cuenta/plan", permanent: true },
      { source: "/cart", destination: "/mi-cuenta/plan", permanent: true },
      {
        source: "/finalizar-compra",
        destination: "/mi-cuenta/plan",
        permanent: true,
      },
      { source: "/wp-login.php", destination: "/login", permanent: true },
      { source: "/wp-admin", destination: "/admin", permanent: false },
      { source: "/wp-admin/:path*", destination: "/admin", permanent: false },
      { source: "/confirmar-regalo", destination: "/", permanent: false },
      { source: "/confirmar-regalo/", destination: "/", permanent: false },
      { source: "/fin-regalo", destination: "/", permanent: false },
      { source: "/fin-regalo/", destination: "/", permanent: false },
      {
        source: "/pending",
        destination: "/mi-cuenta/plan?payment=pending",
        permanent: false,
      },
      {
        source: "/failure",
        destination: "/mi-cuenta/plan?payment=failure",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
