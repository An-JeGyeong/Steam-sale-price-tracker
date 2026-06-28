import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const steamId    = req.cookies.get("steam_id")?.value    ?? null;
  const steamName  = req.cookies.get("steam_name")?.value  ?? null;
  const steamAvatar = req.cookies.get("steam_avatar")?.value ?? null;
  return NextResponse.json({ loggedIn: !!steamId, steamName, steamAvatar });
}
