import { NextRequest, NextResponse } from "next/server";
import { getDeals } from "@/lib/itad";

export async function GET(req: NextRequest) {
  const limitRaw = parseInt(req.nextUrl.searchParams.get("limit") ?? "8", 10);
  const limit = Number.isNaN(limitRaw) ? 8 : limitRaw;
  const sort  = req.nextUrl.searchParams.get("sort") ?? "-cut";
  try {
    const deals = await getDeals(Math.min(limit, 20), "KR", sort);
    return NextResponse.json(deals);
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
