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
      // Game image CDNs: wildcard covers all Steam subdomains (incl. new shared.fastly.*),
      // IGDB (used by ITAD for boxart), and other game store CDNs
      "img-src 'self' data: https://*.steamstatic.com https://*.steampowered.com https://*.akamaihd.net https://images.igdb.com https://isthereanydeal.com https://steamcommunity.com",
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
