import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "minio-w9cs7x7mnuwctiv2hjuo6m5s.185.201.8.71.sslip.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
  output: "standalone",
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: 10 * 1024 * 1024, // 10MB for photo uploads
      allowedOrigins: ["mydailyroutine.app", "mydailyroutine.app:443"],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; img-src 'self' data: https:; media-src 'self' data: https:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: cdn.paddle.com; connect-src 'self' https: wss:; frame-src 'self' https://sandbox-buy.paddle.com https://buy.paddle.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
