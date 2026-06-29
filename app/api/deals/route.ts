import { NextRequest, NextResponse } from "next/server";
import { getDeals } from "@/lib/itad";

export async function GET(req: NextRequest) {
  const limitRaw = parseInt(req.nextUrl.searchParams.get("limit") ?? "8", 10);
  const limit = Number.isNaN(limitRaw) ? 8 : limitRaw;
  const VALID_SORTS = new Set(["-cut", "expiry", "price", "-price", "added", "-added"]);
  const sortRaw = req.nextUrl.searchParams.get("sort") ?? "-cut";
  const sort = VALID_SORTS.has(sortRaw) ? sortRaw : "-cut";
  try {
    const deals = await getDeals(Math.min(limit, 100), "KR", sort);
    return NextResponse.json(deals);
  } catch {
    return NextResponse.json({ error: "딜 목록 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
