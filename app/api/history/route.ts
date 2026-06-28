import { NextRequest, NextResponse } from "next/server";
import { getPriceHistory } from "@/lib/itad";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id 파라미터가 필요합니다." }, { status: 400 });
  }
  try {
    const history = await getPriceHistory(id);
    return NextResponse.json(history);
  } catch {
    return NextResponse.json({ error: "가격 히스토리 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
