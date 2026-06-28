import { NextRequest, NextResponse } from "next/server";
import { getDeals } from "@/lib/itad";

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "8");
  try {
    const deals = await getDeals(Math.min(limit, 20));
    return NextResponse.json(deals);
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
