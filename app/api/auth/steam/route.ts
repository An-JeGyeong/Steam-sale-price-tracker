import { NextRequest, NextResponse } from "next/server";
import { getSteamLoginUrl } from "@/lib/steam";

export async function GET(req: NextRequest) {
  // Prefer explicit env var to avoid Host-header injection; fall back to request origin
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? vercelUrl ?? req.nextUrl.origin;
  const returnTo = `${appUrl}/api/auth/steam/callback`;
  const loginUrl = getSteamLoginUrl(returnTo, appUrl);
  return NextResponse.redirect(loginUrl);
}
