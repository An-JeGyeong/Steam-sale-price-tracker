import { NextRequest, NextResponse } from "next/server";

export interface ReviewSummary {
  score: number;
  totalPositive: number;
  totalNegative: number;
  totalReviews: number;
  positivePercent: number;
}

export async function GET(req: NextRequest) {
  const appid = req.nextUrl.searchParams.get("appid");
  if (!appid || !/^\d+$/.test(appid)) {
    return NextResponse.json({ error: "유효한 appid가 필요합니다." }, { status: 400 });
  }

  try {
    const url = `https://store.steampowered.com/appreviews/${appid}?json=1&language=all&num_per_page=0`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ error: "리뷰 조회 실패" }, { status: 502 });

    const data = (await res.json()) as {
      success: number;
      query_summary?: {
        review_score: number;
        total_positive: number;
        total_negative: number;
        total_reviews: number;
      };
    };

    if (!data.success || !data.query_summary) {
      return NextResponse.json({ error: "리뷰 없음" }, { status: 404 });
    }

    const qs = data.query_summary;
    const positivePercent =
      qs.total_reviews > 0
        ? Math.round((qs.total_positive / qs.total_reviews) * 100)
        : 0;

    const summary: ReviewSummary = {
      score: qs.review_score,
      totalPositive: qs.total_positive,
      totalNegative: qs.total_negative,
      totalReviews: qs.total_reviews,
      positivePercent,
    };

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: "리뷰 조회 중 오류 발생" }, { status: 500 });
  }
}
