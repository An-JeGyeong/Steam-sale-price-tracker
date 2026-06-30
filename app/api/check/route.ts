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

  const countryRaw = req.nextUrl.searchParams.get("country") ?? "KR";
  // ISO 3166-1 alpha-2: 2 uppercase letters only
  const country = /^[A-Z]{2}$/.test(countryRaw) ? countryRaw : "KR";

  try {
    const [result] = await getPrices([id], country);
    if (!result) {
      return NextResponse.json({ error: "현재 판매 중인 상점 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const steamDeals = result.deals.filter((d) => d.shop.id === 61);
    if (steamDeals.length === 0) {
      return NextResponse.json({ error: "Steam에서 현재 판매 중인 상점 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const bestDeal = steamDeals.reduce((a, b) => (a.price.amount <= b.price.amount ? a : b));
    const historyLow = result.historyLow?.all ?? null;
    const isAllTimeLow = historyLow != null && bestDeal.price.amount <= historyLow.amount;

    const response = CheckResultSchema.parse({ bestDeal, historyLow, isAllTimeLow });
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "가격 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
