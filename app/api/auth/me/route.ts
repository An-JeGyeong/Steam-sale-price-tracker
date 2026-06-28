import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const steamId = req.cookies.get("steam_id")?.value ?? null;
  return NextResponse.json({ loggedIn: !!steamId, steamId });
}
