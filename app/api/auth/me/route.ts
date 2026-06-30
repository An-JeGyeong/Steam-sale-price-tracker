import { NextRequest, NextResponse } from "next/server";
import { verifyValue } from "@/lib/session";

export async function GET(req: NextRequest) {
  const rawId       = req.cookies.get("steam_id")?.value    ?? null;
  const steamId     = rawId ? verifyValue(rawId) : null;
  const steamName   = req.cookies.get("steam_name")?.value  ?? null;
  const steamAvatar = req.cookies.get("steam_avatar")?.value ?? null;
  return NextResponse.json({ loggedIn: !!steamId, steamName, steamAvatar });
}
