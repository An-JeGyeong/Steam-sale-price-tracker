import { NextRequest, NextResponse } from "next/server";
import { verifySteamOpenId } from "@/lib/steam";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  let steamId: string | null = null;
  try {
    steamId = await verifySteamOpenId(params);
  } catch {
    return NextResponse.redirect(new URL("/?error=auth_failed", req.url));
  }

  if (!steamId) {
    return NextResponse.redirect(new URL("/?error=auth_invalid", req.url));
  }

  const res = NextResponse.redirect(new URL("/wishlist", req.url));
  res.cookies.set("steam_id", steamId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: "/",
  });
  return res;
}
