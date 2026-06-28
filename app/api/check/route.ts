import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getPrices, DealSchema, PriceInfoSchema } from "@/lib/itad";

const CheckResultSchema = z.object({
  bestDeal: DealSchema,
  historyLow: PriceInfoSchema.nullable(),
  isAllTimeLow: z.boolean(),
});

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id 파라미터가 필요합니다." }, { status: 400 });
  }

  const country = req.nextUrl.searchParams.get("country") ?? "KR";

  try {
    const [result] = await getPrices([id], country);
    if (!result || result.deals.length === 0) {
      return NextResponse.json({ error: "현재 판매 중인 상점 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const bestDeal = result.deals.reduce((a, b) => (a.price.amount <= b.price.amount ? a : b));
    const historyLow = result.historyLow?.all ?? null;
    const isAllTimeLow = historyLow != null && bestDeal.price.amount <= historyLow.amount;

    const response = CheckResultSchema.parse({ bestDeal, historyLow, isAllTimeLow });
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
