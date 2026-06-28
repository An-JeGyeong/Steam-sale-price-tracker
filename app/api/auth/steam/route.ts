import { NextRequest, NextResponse } from "next/server";
import { getSteamLoginUrl } from "@/lib/steam";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const returnTo = `${origin}/api/auth/steam/callback`;
  const loginUrl = getSteamLoginUrl(returnTo, origin);
  return NextResponse.redirect(loginUrl);
}
