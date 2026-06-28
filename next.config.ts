import type { NextConfig } from "next";

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
      // Google Fonts preconnect + stylesheet
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Steam CDN images + ITAD boxart
      "img-src 'self' data: https://cdn.akamai.steamstatic.com https://cdn.cloudflare.steamstatic.com https://avatars.steamstatic.com https://avatars.akamai.steamstatic.com https://isthereanydeal.com",
      // Our own API routes + external APIs called client-side (none — all fetches are server-side)
      "connect-src 'self'",
      // Scripts: Next.js requires 'unsafe-inline' + 'unsafe-eval' in dev; in prod only self
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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
