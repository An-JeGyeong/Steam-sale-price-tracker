import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Frame-Options",          value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",   value: "nosniff" },
  { key: "X-DNS-Prefetch-Control",   value: "on" },
  { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Explicit Steam CDN hosts — avoid wildcard https: to limit tracking-pixel exfiltration
      "img-src 'self' data: https://cdn.cloudflare.steamstatic.com https://cdn.akamai.steamstatic.com https://avatars.steamstatic.com https://avatars.akamai.steamstatic.com https://images.igdb.com https://cdn.isthereanydeal.com https://assets.isthereanydeal.com https://steamcommunity.com",
      "connect-src 'self'",
      // unsafe-eval only in dev (hot reload); unsafe-inline required by Next.js runtime in both envs
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
