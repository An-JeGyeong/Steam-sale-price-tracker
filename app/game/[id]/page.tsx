"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import PriceChart, { type RawPoint } from "@/components/PriceChart";
import type { HistoryPoint, DealItem } from "@/lib/itad";
import { steamAppIdFromUrl, steamHeroUrl, steamHeaderUrl, steamCapsuleUrl } from "@/lib/itad";

/* ── mock chart data (fallback) ── */
const MOCK_RAW: RawPoint[] = [
  { m: "25.7",  p: 19800, sale: "여름세일", d: 64 },
  { m: "25.8",  p: 55000 },
  { m: "25.9",  p: 38500, sale: "가을한정", d: 30 },
  { m: "25.10", p: 55000 },
  { m: "25.11", p: 55000 },
  { m: "25.12", p: 16500, sale: "겨울세일", d: 70, low: true },
  { m: "26.1",  p: 55000 },
  { m: "26.2",  p: 55000 },
  { m: "26.3",  p: 27500, sale: "봄세일",  d: 50 },
  { m: "26.4",  p: 55000 },
  { m: "26.5",  p: 55000 },
  { m: "26.6",  p: 18150, sale: "여름세일", d: 67, cur: true },
];


const HERO_BG = "repeating-linear-gradient(45deg,transparent 0 18px,rgba(32,36,34,.5) 18px 36px),linear-gradient(135deg,#1c1f1e,#141716)";
const CAP_BG  = "repeating-linear-gradient(45deg,transparent 0 16px,rgba(32,36,34,.5) 16px 32px),linear-gradient(135deg,#1e211f,#141716)";
const REC_BG  = "repeating-linear-gradient(45deg,transparent 0 14px,rgba(32,36,34,.6) 14px 28px),linear-gradient(135deg,#1c1f1e,#141716)";

/* ── Steam 리뷰 ── */
interface ReviewSummary {
  score: number;
  totalPositive: number;
  totalNegative: number;
  totalReviews: number;
  positivePercent: number;
}

const REVIEW_META: Record<number, { label: string; color: string; bg: string; border: string }> = {
  9: { label: "압도적으로 긍정적", color: "#66c0f4", bg: "rgba(102,192,244,.1)",  border: "rgba(102,192,244,.28)" },
  8: { label: "매우 긍정적",      color: "#66c0f4", bg: "rgba(102,192,244,.1)",  border: "rgba(102,192,244,.28)" },
  7: { label: "긍정적",          color: "#66c0f4", bg: "rgba(102,192,244,.08)", border: "rgba(102,192,244,.22)" },
  6: { label: "대체로 긍정적",    color: "#b5cfe1", bg: "rgba(181,207,225,.08)", border: "rgba(181,207,225,.2)"  },
  5: { label: "복합적",          color: "#c6d4df", bg: "rgba(198,212,223,.07)", border: "rgba(198,212,223,.2)"  },
  4: { label: "대체로 부정적",    color: "#e07b5a", bg: "rgba(224,123,90,.1)",   border: "rgba(224,123,90,.28)"  },
  3: { label: "부정적",          color: "#e84c3d", bg: "rgba(232,76,61,.1)",    border: "rgba(232,76,61,.28)"   },
  2: { label: "매우 부정적",      color: "#e84c3d", bg: "rgba(232,76,61,.1)",    border: "rgba(232,76,61,.28)"   },
  1: { label: "압도적으로 부정적", color: "#e84c3d", bg: "rgba(232,76,61,.1)",    border: "rgba(232,76,61,.28)"   },
};

function won(n: number) { return "₩" + n.toLocaleString("ko-KR"); }

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${title} — 스팀 최저가 트래커`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  }

  return (
    <button
      onClick={handleShare}
      style={{
        marginTop: 9, width: "100%", height: 42,
        border: "1px solid #2a3533", borderRadius: 11, background: "#141817",
        color: copied ? "#5fd39a" : "#a3a8a4", fontSize: 14, fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontFamily: "'Noto Sans KR',system-ui,sans-serif",
        transition: "color .2s",
      }}
    >
      {copied ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          링크 복사됨
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          공유하기
        </>
      )}
    </button>
  );
}

function safeUrl(url: string): string | undefined {
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? url : undefined;
  } catch { return undefined; }
}

function fmtCountdown(sec: number): string {
  if (sec <= 0) return "종료";
  let s = sec;
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600);  s -= h * 3600;
  const m = Math.floor(s / 60);    s -= m * 60;
  const z = (v: number) => String(v).padStart(2, "0");
  return `${d}d ${z(h)}:${z(m)}:${z(s)}`;
}

function historyToRaw(history: HistoryPoint[]): RawPoint[] {
  if (history.length === 0) return [];
  const byMonth = new Map<string, { p: number; cut: number }>();
  for (const h of history) {
    const date = new Date(h.timestamp);
    const key = `${String(date.getFullYear()).slice(2)}.${date.getMonth() + 1}`;
    const cur = byMonth.get(key);
    if (!cur || h.deal.price.amount < cur.p) {
      byMonth.set(key, { p: h.deal.price.amount, cut: h.deal.cut });
    }
  }
  const entries = Array.from(byMonth.entries());
  const minPrice = Math.min(...entries.map(([, v]) => v.p));
  return entries.map(([m, v], i) => ({
    m,
    p: v.p,
    sale: v.cut > 0 ? "세일" : undefined,
    d: v.cut > 0 ? v.cut : undefined,
    low: v.p === minPrice,
    cur: i === entries.length - 1,
  }));
}

export default function GameDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gameId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const titleParam = searchParams.get("title") ?? "";

  /* price state */
  const [priceData, setPriceData] = useState<{
    title: string;
    now: number;
    old: number;
    disc: number;
    histLow: number | null;
    isAllTimeLow: boolean;
    shopUrl: string;
    expiryTs: string | null;
  } | null>(null);
  const [rawPoints, setRawPoints] = useState<RawPoint[]>(MOCK_RAW);
  const [priceError, setPriceError] = useState(false);
  const [relatedDeals, setRelatedDeals] = useState<DealItem[]>([]);
  const [reviews, setReviews] = useState<ReviewSummary | null>(null);

  /* countdown */
  const [remain, setRemain] = useState(1 * 86400 + 14 * 3600 + 22 * 60 + 3);
  useEffect(() => {
    const iv = setInterval(() => setRemain((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(iv);
  }, []);

  /* fetch price data */
  useEffect(() => {
    if (!gameId) return;
    fetch(`/api/check?id=${encodeURIComponent(gameId)}&country=KR`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        const { bestDeal, historyLow, isAllTimeLow } = data;
        setPriceData({
          title: titleParam || bestDeal.shop.name,
          now: bestDeal.price.amount,
          old: bestDeal.regular.amount,
          disc: bestDeal.cut,
          histLow: historyLow?.amount ?? null,
          isAllTimeLow,
          shopUrl: bestDeal.url,
          expiryTs: bestDeal.expiry ?? null,
        });
        if (bestDeal.expiry) {
          const secs = Math.max(0, Math.floor((new Date(bestDeal.expiry).getTime() - Date.now()) / 1000));
          setRemain(secs);
        }
      })
      .catch(() => setPriceError(true));
  }, [gameId, titleParam]);

  /* fetch price history */
  useEffect(() => {
    if (!gameId) return;
    fetch(`/api/history?id=${encodeURIComponent(gameId)}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: HistoryPoint[]) => {
        const pts = historyToRaw(data);
        if (pts.length >= 2) setRawPoints(pts);
      })
      .catch(() => { /* keep mock */ });
  }, [gameId]);

  /* fetch related deals */
  useEffect(() => {
    fetch("/api/deals?limit=8")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: unknown) => {
        if (!Array.isArray(data)) return;
        const filtered = (data as DealItem[]).filter((d) => d.id !== gameId).slice(0, 4);
        setRelatedDeals(filtered);
      })
      .catch(() => {});
  }, [gameId]);

  /* fetch Steam reviews (depends on appId extracted after price loads) */
  const appIdParam = searchParams.get("appid") ?? null;
  const appId = appIdParam ?? (priceData?.shopUrl ? steamAppIdFromUrl(priceData.shopUrl) : null);
  useEffect(() => {
    if (!appId) return;
    fetch(`/api/steam/reviews?appid=${appId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: ReviewSummary | null) => { if (d && !("error" in d)) setReviews(d); })
      .catch(() => {});
  }, [appId]);

  const priceLoading = !priceData && !priceError;
  const title = titleParam || priceData?.title || "게임 타이틀";
  const now   = priceData?.now ?? 0;
  const old   = priceData?.old ?? 0;
  const disc  = priceData?.disc ?? 0;
  const histLow = priceData?.histLow ?? (rawPoints.length > 0 ? Math.min(...rawPoints.map((p) => p.p)) : 0);
  const avg   = rawPoints.length > 0 ? Math.round(rawPoints.reduce((s, p) => s + p.p, 0) / rawPoints.length) : 0;
  const isLow = priceData?.isAllTimeLow ?? false;
  const diff  = now - histLow;

  const verdictBg  = priceLoading ? "#2c4135" : isLow ? "#5fd39a" : priceError ? "#e8705f" : "#5fd39a";
  const verdictTxt = priceLoading ? "가격 불러오는 중…" : isLow ? "역대 최저가!" : priceError ? "가격 확인 필요" : "지금 사기 좋은 가격";

  const itadBoxart = `https://assets.isthereanydeal.com/${gameId}/boxart.jpg`;
  const heroImgUrl = appId ? steamHeroUrl(appId) : itadBoxart;
  const capImgUrl  = appId ? steamCapsuleUrl(appId) : itadBoxart;
  const reviewMeta = reviews ? REVIEW_META[reviews.score] : null;

  const panel = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{
      background: "linear-gradient(180deg,#171a1a,#121414)",
      border: "1px solid #272d2d", borderRadius: 14, padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );

  return (
    <div>
      <Nav />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 22px 0" }}>

        {/* breadcrumb */}
        <div style={{ fontSize: 12.5, color: "#7e827f", marginBottom: 16, letterSpacing: 0.2 }}>
          <Link href="/" style={{ color: "#7e827f" }}>홈</Link> › <strong style={{ color: "#cfd3d0", fontWeight: 600 }}>{title}</strong>
        </div>

        {/* hero image */}
        <div style={{ height: 300, borderRadius: 14, border: "1px solid #272d2d", background: HERO_BG, display: "flex", alignItems: "flex-end", padding: "22px 26px", position: "relative", overflow: "hidden" }}>
          {heroImgUrl && (
            <img
              src={heroImgUrl}
              alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                const fb1 = appId ? steamHeaderUrl(appId) : null;
                const fb2 = itadBoxart;
                if (!img.dataset.fb && fb1 && img.src !== fb1) { img.dataset.fb = "1"; img.src = fb1; }
                else if (img.dataset.fb !== "2" && img.src !== fb2) { img.dataset.fb = "2"; img.src = fb2; }
                else img.style.display = "none";
              }}
            />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.78) 0%, rgba(0,0,0,.35) 55%, rgba(0,0,0,.08) 100%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.6, color: "#f2f8f4", textShadow: "0 2px 18px rgba(0,0,0,.55)", lineHeight: 1.1 }}>
              {title}
            </div>
            <div style={{ fontSize: 14, color: "#abafac", marginTop: 6 }}>Steam</div>
          </div>
        </div>

        {/* tags */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#a3a8a4", background: "#1a1d1d", border: "1px solid #272d2d", padding: "4px 10px", borderRadius: 20 }}>Steam</span>
          {isLow && (
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "#5fd39a", background: "rgba(67,194,130,.1)", border: "1px solid rgba(67,194,130,.3)", padding: "4px 10px", borderRadius: 20 }}>🏆 역대 최저가</span>
          )}
          {reviewMeta && reviews && (
            <span
              title={`긍정 ${reviews.totalPositive.toLocaleString("ko-KR")}개 / 부정 ${reviews.totalNegative.toLocaleString("ko-KR")}개 / 전체 ${reviews.totalReviews.toLocaleString("ko-KR")}개`}
              style={{
                fontSize: 11.5, fontWeight: 600,
                color: reviewMeta.color, background: reviewMeta.bg,
                border: `1px solid ${reviewMeta.border}`,
                padding: "4px 10px", borderRadius: 20,
                display: "inline-flex", alignItems: "center", gap: 5, cursor: "default",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
              </svg>
              {reviewMeta.label}
              <span style={{ opacity: 0.75, fontFamily: "'IBM Plex Mono',monospace" }}>({reviews.positivePercent}%)</span>
            </span>
          )}
        </div>

        {/* main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 22, marginTop: 22, alignItems: "start" }}>

          {/* left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* price chart panel */}
            {panel(
              <PriceChart raw={rawPoints} historyLow={histLow} avg={avg} regular={old} />
            )}

            {/* stats row */}
            {panel(
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {priceLoading ? (
                  Array.from({ length: 4 }, (_, i) => (
                    <div key={i} style={{ background: "#121414", border: "1px solid #272d2d", borderRadius: 12, padding: "13px 14px" }}>
                      <div style={{ height: 10, width: "55%", borderRadius: 4, background: "#1e2222", marginBottom: 10 }} />
                      <div style={{ height: 20, width: "80%", borderRadius: 5, background: "#1e2a22", animation: "pulse 1.4s ease-in-out infinite" }} />
                    </div>
                  ))
                ) : (
                  [
                    { k: "정가",     v: won(old),    g: false, sub: null,                   hl: false },
                    { k: "역대 최저", v: histLow > 0 ? won(histLow) : "—", g: true, sub: "전체 기간", hl: true },
                    { k: "평균가",   v: avg > 0 ? won(avg) : "—", g: false, sub: "히스토리 기반", hl: false },
                    { k: "현재가",   v: won(now),    g: true,  sub: isLow ? "역대 최저!" : diff > 0 ? `역대최저 +${won(diff)}` : null, hl: false },
                  ].map(({ k, v, g, sub, hl }) => (
                    <div key={k} style={{
                      background: hl ? "rgba(67,194,130,.07)" : "#121414",
                      border: `1px solid ${hl ? "rgba(67,194,130,.4)" : "#272d2d"}`,
                      borderRadius: 12, padding: "13px 14px",
                    }}>
                      <div style={{ fontSize: 11, color: "#828783", fontWeight: 600, marginBottom: 7 }}>{k}</div>
                      <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.3, color: g ? "#5fd39a" : "#cfd3d0", fontFamily: "'IBM Plex Mono',monospace" }}>{v}</div>
                      {sub && <div style={{ fontSize: 10.5, color: "#7e827f", marginTop: 4 }}>{sub}</div>}
                    </div>
                  ))
                )}
              </div>,
              { padding: "16px 20px" }
            )}

            {/* game info panel */}
            {panel(<>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#eef6f0", display: "flex", alignItems: "center", gap: 9 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#828783" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5h.01" />
                  </svg>
                  게임 정보
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#222727", border: "1px solid #272d2d", borderRadius: 12, overflow: "hidden" }}>
                {[
                  { k: "게임 ID",      v: gameId },
                  { k: "플랫폼",       v: "Steam" },
                  { k: "현재 최저 가격", v: won(now) },
                  { k: "정가",         v: won(old) },
                ].map(({ k, v }) => (
                  <div key={k} style={{ background: "#121414", padding: "13px 15px" }}>
                    <div style={{ fontSize: 11, color: "#828783", fontWeight: 600, marginBottom: 6 }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#cfd3d0", wordBreak: "break-all" }}>{v}</div>
                  </div>
                ))}
              </div>
            </>)}

            {/* related deals panel */}
            {relatedDeals.length > 0 && panel(<>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#eef6f0", display: "flex", alignItems: "center", gap: 9 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#828783" strokeWidth="2">
                    <path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 12 10 12 2z" />
                  </svg>
                  지금 할인 중인 게임
                </div>
                <Link href="/" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: "#7e827f", textDecoration: "none" }}>전체 보기 →</Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                {relatedDeals.map((r) => (
                  <Link key={r.id} href={`/game/${r.id}?title=${encodeURIComponent(r.title)}`} style={{ textDecoration: "none" }}>
                    <div style={{ background: "#121414", border: "1px solid #272d2d", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ height: 84, background: REC_BG, overflow: "hidden", position: "relative" }}>
                        {(() => {
                          const rid = steamAppIdFromUrl(r.deal.url);
                          const src = r.assets?.boxart ?? (rid ? steamHeaderUrl(rid) : null);
                          return src ? (
                            <img
                              src={src}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : null;
                        })()}
                      </div>
                      <div style={{ padding: "11px 13px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#cfd3d0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, color: "#07120b", background: "#5fd39a", padding: "2px 6px", borderRadius: 5 }}>-{r.deal.cut}%</span>
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 700, color: "#5fd39a" }}>{won(r.deal.price.amount)}</span>
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#7e827f", textDecoration: "line-through" }}>{won(r.deal.regular.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>)}
          </div>

          {/* right column — sticky buy panel */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ background: "linear-gradient(180deg,#15241b,#121414)", border: "1px solid #28402f", borderRadius: 14, overflow: "hidden" }}>
              {/* capsule image */}
              <div style={{ height: 140, background: CAP_BG, position: "relative", display: "flex", alignItems: "flex-end", padding: 12, overflow: "hidden" }}>
                {capImgUrl && (
                  <img
                    src={capImgUrl}
                    alt=""
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.55) 0%, transparent 60%)" }} />
                <span style={{ position: "relative", zIndex: 1,
                  display: "inline-flex", alignItems: "center", gap: 7,
                  fontSize: 12, fontWeight: 700, color: "#0a120d",
                  background: verdictBg, padding: "5px 11px", borderRadius: 7,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a120d" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {verdictTxt}
                </span>
              </div>

              <div style={{ padding: 18 }}>
                {/* price row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
                  {priceLoading ? (
                    <div style={{ height: 44, flex: 1, borderRadius: 9, background: "#1e2222", animation: "pulse 1.4s ease-in-out infinite" }} />
                  ) : (
                    <>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 20, fontWeight: 600, color: "#0a120d", background: "#5fd39a", padding: "7px 11px", borderRadius: 9, lineHeight: 1 }}>-{disc}%</span>
                      <div>
                        <div style={{ fontSize: 13, color: "#7e827f", textDecoration: "line-through", fontFamily: "'IBM Plex Mono',monospace" }}>{won(old)}</div>
                        <div style={{ fontSize: 27, fontWeight: 800, color: "#f2f8f4", letterSpacing: -0.5, fontFamily: "'IBM Plex Mono',monospace" }}>{won(now)}</div>
                      </div>
                    </>
                  )}
                </div>

                {/* countdown */}
                <div style={{ marginTop: 14, background: "#121414", border: "1px solid #272d2d", borderRadius: 10, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#a3a8a4", fontWeight: 600 }}>⏳ 세일 종료까지</span>
                  <span style={{ fontSize: 17, fontWeight: 700, color: "#ffb454", fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 0.5 }}>
                    {fmtCountdown(remain)}
                  </span>
                </div>

                {/* CTA buttons */}
                {priceData?.shopUrl && safeUrl(priceData.shopUrl) ? (
                  <a
                    href={safeUrl(priceData.shopUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginTop: 14, width: "100%", height: 46, border: "none", borderRadius: 11,
                      background: "linear-gradient(135deg,#43c282,#1d7a52)",
                      color: "#06120b", fontSize: 15, fontWeight: 800, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: "0 6px 20px rgba(67,194,130,.25)",
                      fontFamily: "'Noto Sans KR',system-ui,sans-serif",
                      textDecoration: "none",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06120b" strokeWidth="2.4">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Steam에서 구매
                  </a>
                ) : (
                  <div style={{
                    marginTop: 14, width: "100%", height: 46, borderRadius: 11,
                    background: priceError ? "rgba(232,112,95,.15)" : "#1a2420",
                    border: `1px solid ${priceError ? "rgba(232,112,95,.3)" : "#2c4135"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: priceError ? "#e8705f" : "#5a7165", fontSize: 13, fontWeight: 600,
                    fontFamily: "'Noto Sans KR',system-ui,sans-serif",
                  }}>
                    {priceError ? "가격 정보 없음" : "가격 불러오는 중…"}
                  </div>
                )}
                <button style={{
                  marginTop: 9, width: "100%", height: 42,
                  border: "1px solid #2c4135", borderRadius: 11, background: "#171a1a",
                  color: "#cfd3d0", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "'Noto Sans KR',system-ui,sans-serif",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cfd3d0" strokeWidth="2">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" />
                  </svg>
                  가격 알림 설정
                </button>
                <ShareButton title={title} />

                {/* Steam 리뷰 */}
                {reviewMeta && reviews && (
                  <div style={{ marginTop: 14, background: "#0d1512", border: `1px solid ${reviewMeta.border}`, borderRadius: 11, padding: "13px 15px" }}>
                    <div style={{ fontSize: 11, color: "#7e827f", fontWeight: 600, marginBottom: 8, letterSpacing: 0.3, textTransform: "uppercase", fontFamily: "'IBM Plex Mono',monospace" }}>
                      Steam 리뷰
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: reviewMeta.color, display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
                        </svg>
                        {reviewMeta.label}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: reviewMeta.color, fontFamily: "'IBM Plex Mono',monospace" }}>
                        {reviews.positivePercent}%
                      </span>
                    </div>
                    {/* 긍정률 바 */}
                    <div style={{ height: 5, borderRadius: 3, background: "#1e2222", overflow: "hidden", marginBottom: 8 }}>
                      <div style={{
                        height: "100%", borderRadius: 3,
                        width: `${reviews.positivePercent}%`,
                        background: reviewMeta.color,
                        transition: "width .6s ease",
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#5a615d", fontFamily: "'IBM Plex Mono',monospace" }}>
                      긍정 {reviews.totalPositive.toLocaleString("ko-KR")}개 · 전체 {reviews.totalReviews.toLocaleString("ko-KR")}개
                    </div>
                  </div>
                )}

                {/* note */}
                <div style={{ marginTop: 13, fontSize: 11.5, color: "#8b8f8b", textAlign: "center", lineHeight: 1.5 }}>
                  {isLow
                    ? <><strong style={{ color: "#5fd39a" }}>역대 최저가입니다!</strong><br />지금이 구매 최적기예요</>
                    : diff > 0
                      ? <>현재가는 <strong style={{ color: "#5fd39a" }}>역대 최저가보다 {won(diff)} 높습니다</strong><br />세일 기간을 기다려보세요</>
                      : "가격 정보를 불러오는 중입니다…"
                  }
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
