import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSteamLoginUrl } from "@/lib/steam";

export async function GET(req: NextRequest) {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? vercelUrl;

  if (!appUrl && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const origin = appUrl ?? req.nextUrl.origin;
  const nonce = randomBytes(16).toString("hex");
  const returnTo = `${origin}/api/auth/steam/callback?nonce=${nonce}`;
  const loginUrl = getSteamLoginUrl(returnTo, origin);

  const res = NextResponse.redirect(loginUrl);
  res.cookies.set("openid_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  return res;
}
