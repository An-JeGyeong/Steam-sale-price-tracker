import { NextRequest, NextResponse } from "next/server";
import { fetchSteamWishlist } from "@/lib/steam";
import { lookupByAppId, getPrices } from "@/lib/itad";

export async function GET(req: NextRequest) {
  const steamId = req.cookies.get("steam_id")?.value;
  if (!steamId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    // 1. Steam에서 위시리스트 가져오기
    const wishGames = await fetchSteamWishlist(steamId);
    const total = wishGames.length;

    // 2. 처음 40개만 처리 (과도한 API 호출 방지)
    const batch = wishGames.slice(0, 40);

    // 3. Steam AppID → ITAD 게임 ID 병렬 조회
    const lookups = await Promise.allSettled(
      batch.map((g) => lookupByAppId(g.appId))
    );

    const matched: { appId: number; title: string; capsule?: string; itadId: string }[] = [];
    lookups.forEach((res, i) => {
      if (res.status === "fulfilled" && res.value) {
        matched.push({
          appId: batch[i].appId,
          title: batch[i].title,
          capsule: batch[i].capsule,
          itadId: res.value.id,
        });
      }
    });

    if (matched.length === 0) {
      return NextResponse.json({ steamId, games: [], total, matched: 0 });
    }

    // 4. ITAD 가격 일괄 조회
    const prices = await getPrices(matched.map((m) => m.itadId));

    // 5. 결과 합치기 — 현재 할인 중인 게임만
    const games = matched
      .map((m) => {
        const pr = prices.find((p) => p.id === m.itadId);
        if (!pr || pr.deals.length === 0) return null;

        const steamDeals = pr.deals.filter((d) => d.shop.id === 61);
        const anyDeals    = pr.deals;
        const dealList    = steamDeals.length > 0 ? steamDeals : anyDeals;
        const best = dealList.reduce((a, b) => a.price.amount <= b.price.amount ? a : b);
        const histLow = pr.historyLow?.all ?? null;

        return {
          appId:       m.appId,
          title:       m.title,
          capsule:     m.capsule,
          itadId:      m.itadId,
          now:         best.price.amount,
          old:         best.regular.amount,
          disc:        best.cut,
          histLow:     histLow?.amount ?? null,
          isAllTimeLow: histLow != null && best.price.amount <= histLow.amount,
          onSale:      best.cut > 0,
          shopUrl:     best.url,
          shop:        best.shop.name,
          expiry:      best.expiry ?? null,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ steamId, games, total, matched: matched.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
