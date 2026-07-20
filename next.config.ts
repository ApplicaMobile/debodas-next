import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
