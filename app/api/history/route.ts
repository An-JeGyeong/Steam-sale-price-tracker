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
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
