import { NextRequest, NextResponse } from "next/server";
import { verifySteamOpenId } from "@/lib/steam";
import { signValue } from "@/lib/session";

async function fetchSteamProfile(steamId: string): Promise<{ name: string; avatar: string } | null> {
  try {
    const res = await fetch(
      `https://steamcommunity.com/profiles/${steamId}/?xml=1`,
      { headers: { Accept: "text/xml" } }
    );
    if (!res.ok) return null;
    const xml = await res.text();
    const nameMatch   = xml.match(/<steamID><!\[CDATA\[(.+?)\]\]><\/steamID>/);
    const avatarMatch = xml.match(/<avatarFull><!\[CDATA\[(.+?)\]\]><\/avatarFull>/);
    return {
      name:   nameMatch?.[1]   ?? steamId,
      avatar: avatarMatch?.[1] ?? "",
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  // CSRF: nonce 검증
  const nonce = req.nextUrl.searchParams.get("nonce");
  const cookieNonce = req.cookies.get("openid_nonce")?.value;
  if (!nonce || !cookieNonce || nonce !== cookieNonce) {
    return NextResponse.redirect(new URL("/?error=auth_csrf", req.url));
  }

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

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  };

  // nonce 쿠키 즉시 삭제
  res.cookies.set("openid_nonce", "", { maxAge: 0, path: "/" });

  // HMAC 서명된 값으로 저장
  res.cookies.set("steam_id", signValue(steamId), cookieOpts);

  const profile = await fetchSteamProfile(steamId);
  if (profile) {
    res.cookies.set("steam_name",   profile.name,   cookieOpts);
    res.cookies.set("steam_avatar", profile.avatar, cookieOpts);
  }

  return res;
}
