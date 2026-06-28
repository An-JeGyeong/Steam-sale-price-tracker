import { NextRequest, NextResponse } from "next/server";
import { searchGames } from "@/lib/itad";

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title");
  if (!title) {
    return NextResponse.json({ error: "title 파라미터가 필요합니다." }, { status: 400 });
  }

  try {
    const results = await searchGames(title);
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
