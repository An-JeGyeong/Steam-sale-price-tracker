"use client";

import { useEffect, useState, useRef, useCallback, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import type { GameSearchResult, DealItem } from "@/lib/itad";
import { steamAppIdFromUrl, steamHeaderUrl, steamCapsuleUrl } from "@/lib/itad";

interface WishSaleGame {
  appId: number; title: string; capsule?: string; itadId: string;
  now: number; old: number; disc: number; histLow: number | null;
  isAllTimeLow: boolean; onSale: boolean; shopUrl: string;
}

/* ── helpers ── */
function won(n: number) { return "₩" + n.toLocaleString("ko-KR"); }

function fmtCd(sec: number): string {
  if (sec <= 0) return "종료";
  let s = sec;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60);   s -= m * 60;
  const z = (v: number) => String(v).padStart(2, "0");
  return h >= 1 ? `${h}:${z(m)}:${z(s)}` : `${z(m)}:${z(s)}`;
}

function remainSec(expiry: string | null | undefined): number {
  if (!expiry) return 0;
  return Math.max(0, Math.floor((new Date(expiry).getTime() - Date.now()) / 1000));
}

function discountColor(cut: number): string {
  if (cut >= 75) return "#5fd39a";
  if (cut >= 50) return "#43c282";
  if (cut >= 25) return "#e8b84b";
  return "#a3a8a4";
}

const CAP_SM = "repeating-linear-gradient(45deg,transparent 0 10px,rgba(32,36,34,.55) 10px 20px),linear-gradient(135deg,#1c1f1e,#141716)";

const CAP_XS = "repeating-linear-gradient(45deg,transparent 0 9px,rgba(32,36,34,.55) 9px 18px),linear-gradient(135deg,#1c1f1e,#141716)";

interface SaleBanner { label: string; icon: string; color: string; bg: string; border: string }

function detectSale(): SaleBanner | null {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();

  if ((m === 6 && d >= 15) || (m === 7 && d <= 15))
    return { label: "Steam 여름 세일 진행 중!", icon: "☀️", color: "#f0a030", bg: "rgba(240,160,48,.1)", border: "rgba(240,160,48,.3)" };
  if ((m === 12 && d >= 15) || (m === 1 && d <= 10))
    return { label: "Steam 겨울 세일 진행 중!", icon: "❄️", color: "#60c8e8", bg: "rgba(96,200,232,.1)", border: "rgba(96,200,232,.3)" };
  if (m === 11 && d >= 21)
    return { label: "Steam 가을 세일 진행 중!", icon: "🍂", color: "#dc8040", bg: "rgba(220,128,64,.1)", border: "rgba(220,128,64,.3)" };
  if (m === 3 && d >= 13 && d <= 25)
    return { label: "Steam 봄 세일 진행 중!", icon: "🌸", color: "#e070a8", bg: "rgba(224,112,168,.1)", border: "rgba(224,112,168,.3)" };
  if ((m === 1 && d >= 22) || (m === 2 && d <= 10))
    return { label: "Steam 설날 세일 진행 중!", icon: "🧧", color: "#e04040", bg: "rgba(224,64,64,.1)", border: "rgba(224,64,64,.3)" };
  return null;
}

function getSaleUntil(deals: DealItem[]): string | null {
  const counts = new Map<string, number>();
  for (const deal of deals) {
    if (!deal.deal.expiry) continue;
    const dt = new Date(deal.deal.expiry);
    const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  const [topKey] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const [, rawMonth, rawDay] = topKey.split("-").map(Number);
  return `${rawMonth + 1}월 ${rawDay}일까지`;
}

/* ── skeleton row ── */
function SkeletonRow({ i }: { i: number }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "40px 1fr 80px 90px 100px 90px",
      gap: 0,
      padding: "11px 16px",
      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.018)",
      borderBottom: "1px solid #1a1e1d",
      alignItems: "center",
    }}>
      <div style={{ height: 12, width: 18, borderRadius: 4, background: "#1e2222" }} />
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 56, height: 40, borderRadius: 7, background: CAP_SM, flexShrink: 0 }} />
        <div style={{ height: 13, borderRadius: 5, background: "#1e2222", width: "55%" }} />
      </div>
      <div style={{ height: 22, width: 50, borderRadius: 6, background: "#1e2a22" }} />
      <div style={{ height: 12, width: 60, borderRadius: 4, background: "#181a1a" }} />
      <div style={{ height: 16, width: 72, borderRadius: 5, background: "#1e2222" }} />
      <div style={{ height: 28, width: 60, borderRadius: 8, background: "#1a1d1a" }} />
    </div>
  );
}

/* ── skeleton ending card ── */
function SkeletonEndingCard() {
  return (
    <div style={{
      background: "linear-gradient(180deg,#141716,#101212)",
      border: "1px solid #272d2d", borderRadius: 13,
      padding: 13, display: "flex", gap: 12, alignItems: "center",
    }}>
      <div style={{ width: 54, height: 54, borderRadius: 9, background: CAP_SM, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 14, borderRadius: 5, background: "#1e2222", width: "65%", marginBottom: 8 }} />
        <div style={{ height: 11, borderRadius: 4, background: "#1a1d1a", width: "45%" }} />
      </div>
      <div style={{ width: 52, textAlign: "right" }}>
        <div style={{ height: 11, borderRadius: 4, background: "#1e2a22", marginBottom: 6 }} />
        <div style={{ height: 16, borderRadius: 5, background: "#1e2222" }} />
      </div>
    </div>
  );
}

/* ── skeleton tracked row ── */
function SkeletonTrackedRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 0", borderTop: "1px solid #1e2222" }}>
      <div style={{ width: 18, height: 12, borderRadius: 4, background: "#1e2222" }} />
      <div style={{ width: 38, height: 38, borderRadius: 8, background: CAP_XS, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 13, borderRadius: 5, background: "#1e2222", width: "60%", marginBottom: 6 }} />
        <div style={{ height: 10, borderRadius: 4, background: "#181a1a", width: "35%" }} />
      </div>
      <div style={{ width: 38, height: 18, borderRadius: 5, background: "#1e2a22" }} />
      <div style={{ width: 64, height: 14, borderRadius: 4, background: "#1e2222" }} />
    </div>
  );
}

/* ── hero search ── */
function HeroSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); setSearched(false); return; }
    setLoading(true);
    setOpen(true);
    try {
      const res = await fetch(`/api/search?title=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data: GameSearchResult[] = await res.json();
        setResults(Array.isArray(data) ? data.slice(0, 6) : []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); setSearched(false); return; }
    timerRef.current = setTimeout(() => doSearch(query), 350);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doSearch]);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  function pick(game: GameSearchResult) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/game/${game.id}?title=${encodeURIComponent(game.title)}`);
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={wrapRef} style={{ position: "relative", maxWidth: 560, margin: "26px auto 0" }}>
      <div style={{
        height: 54,
        background: "#141616",
        border: "1px solid #2c4135",
        borderRadius: showDropdown ? "14px 14px 0 0" : 14,
        display: "flex", alignItems: "center", gap: 12, padding: "0 18px",
        boxShadow: "0 8px 30px rgba(0,0,0,.3)",
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7e827f" strokeWidth="2">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" && results[0]) pick(results[0]); if (e.key === "Escape") setOpen(false); }}
          placeholder="게임 이름을 검색하세요 (한글/영어)"
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: "#cfd3d0", fontSize: 15, fontFamily: "'Noto Sans KR',system-ui,sans-serif",
          }}
        />
        <button
          onClick={() => { if (query.trim()) doSearch(query); else if (results[0]) pick(results[0]); }}
          style={{
            fontSize: 13, fontWeight: 700, color: "#06120b",
            background: loading ? "#3a8a62" : "#5fd39a",
            padding: "9px 16px", borderRadius: 10,
            cursor: "pointer", border: "none",
            fontFamily: "'Noto Sans KR',system-ui,sans-serif",
            display: "flex", alignItems: "center", gap: 6,
            transition: "background .15s",
          }}
        >
          {loading ? (
            <>
              <svg width="13" height="13" viewBox="0 0 14 14" style={{ animation: "spin .7s linear infinite" }}>
                <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(6,18,11,.3)" strokeWidth="2" />
                <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#06120b" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
              검색 중
            </>
          ) : "검색"}
        </button>
      </div>
      {showDropdown && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#141716", border: "1px solid #2c4135", borderTop: "none",
          borderRadius: "0 0 14px 14px",
          zIndex: 50, overflow: "hidden",
          boxShadow: "0 16px 50px rgba(0,0,0,.55)",
        }}>
          {loading && results.length === 0 ? (
            <div style={{ padding: "14px 18px", color: "#7e827f", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: "spin .7s linear infinite", flexShrink: 0 }}>
                <circle cx="7" cy="7" r="5.5" fill="none" stroke="#2c4135" strokeWidth="2" />
                <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#5fd39a" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
              검색 중…
            </div>
          ) : results.length > 0 ? (
            results.map((g, i) => (
              <button
                key={g.id}
                onClick={() => pick(g)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "11px 18px",
                  background: "none", border: "none",
                  borderBottom: i < results.length - 1 ? "1px solid #1e2222" : "none",
                  cursor: "pointer", textAlign: "left",
                  color: "#cfd3d0", fontSize: 14, fontWeight: 600,
                  fontFamily: "'Noto Sans KR',system-ui,sans-serif",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(67,194,130,.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
              >
                {g.assets?.boxart ? (
                  <img src={g.assets.boxart} alt="" style={{ width: 46, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <span style={{ width: 46, height: 32, borderRadius: 6, background: "#1a1d1d", flexShrink: 0, display: "inline-block" }} />
                )}
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</span>
              </button>
            ))
          ) : searched ? (
            <div style={{ padding: "14px 18px", color: "#7e827f", fontSize: 13 }}>
              검색 결과가 없습니다
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ── deal table row ── */
function DealRow({ item, rank, isOdd }: { item: DealItem; rank: number; isOdd: boolean }) {
  const [hovered, setHovered] = useState(false);
  const appId = steamAppIdFromUrl(item.deal.url) ?? steamAppIdFromUrl(item.assets?.boxart ?? "");
  const imgSrc = item.assets?.boxart ?? (appId ? steamHeaderUrl(appId) : null);
  const reg = item.deal.regular.amount;
  const now = item.deal.price.amount;
  const cut = item.deal.cut;
  const isLow = item.deal.flag === "H" || item.deal.flag === "N";
  const col = discountColor(cut);

  return (
    <Link
      href={`/game/${item.id}?title=${encodeURIComponent(item.title)}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr 80px 100px 110px 96px",
        gap: 0,
        padding: "10px 16px",
        background: hovered
          ? "rgba(95,211,154,.05)"
          : isOdd ? "rgba(255,255,255,.018)" : "transparent",
        borderBottom: "1px solid #1a1e1d",
        alignItems: "center",
        textDecoration: "none",
        transition: "background 0.12s",
        cursor: "pointer",
      }}
    >
      {/* rank */}
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600, color: "#3d4440" }}>
        {rank}
      </span>

      {/* thumbnail + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ width: 56, height: 40, borderRadius: 7, overflow: "hidden", background: CAP_SM, flexShrink: 0 }}>
          {imgSrc && (
            <img
              src={imgSrc}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                const header  = appId ? steamHeaderUrl(appId) : null;
                const capsule = appId ? steamCapsuleUrl(appId) : null;
                if (header && img.src !== header) { img.src = header; }
                else if (capsule && img.src !== capsule) { img.src = capsule; }
                else { img.style.display = "none"; }
              }}
            />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 700, color: "#dce3de",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {item.title}
          </div>
          {isLow && (
            <span style={{
              display: "inline-block", marginTop: 3,
              fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4,
              color: "#06120b", background: "#5fd39a",
              padding: "1.5px 6px", borderRadius: 4,
            }}>
              역대 최저
            </span>
          )}
        </div>
      </div>

      {/* discount badge */}
      <div>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          minWidth: 50, padding: "4px 8px", borderRadius: 7,
          fontSize: 13, fontWeight: 800,
          color: "#07120b", background: col,
          fontFamily: "'IBM Plex Mono',monospace",
        }}>
          -{cut}%
        </span>
      </div>

      {/* regular price */}
      <div style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 500,
        color: "#4a504d", textDecoration: "line-through",
      }}>
        {won(reg)}
      </div>

      {/* current price */}
      <div style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, fontWeight: 700,
        color: "#5fd39a",
      }}>
        {won(now)}
      </div>

      {/* buy button */}
      <div>
        <a
          href={item.deal.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11.5, fontWeight: 700,
            color: "#07120b", background: "#5fd39a",
            padding: "6px 12px", borderRadius: 8,
            textDecoration: "none", whiteSpace: "nowrap",
          }}
        >
          구매
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17 17 7M7 7h10v10" />
          </svg>
        </a>
      </div>
    </Link>
  );
}

/* ── deal table header ── */
function DealTableHeader() {
  const CELL: CSSProperties = {
    fontSize: 11, fontWeight: 700, color: "#4a504d",
    letterSpacing: 0.6, textTransform: "uppercase",
    fontFamily: "'IBM Plex Mono',monospace",
  };
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "40px 1fr 80px 100px 110px 96px",
      gap: 0,
      padding: "9px 16px",
      borderBottom: "1px solid #222828",
      background: "#111413",
      borderRadius: "12px 12px 0 0",
    }}>
      <span style={CELL}>#</span>
      <span style={CELL}>게임</span>
      <span style={CELL}>할인</span>
      <span style={CELL}>정가</span>
      <span style={CELL}>현재가</span>
      <span style={CELL}>구매</span>
    </div>
  );
}

/* ── main page ── */
export default function HomePage() {
  const [tick, setTick] = useState(0);
  const [rawDeals, setRawDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endingDeals, setEndingDeals] = useState<DealItem[]>([]);
  const [endingLoading, setEndingLoading] = useState(true);
  const [wishSale, setWishSale] = useState<WishSaleGame[]>([]);
  const [wishLoading, setWishLoading] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const me = await meRes.json() as { loggedIn: boolean };
        if (!me.loggedIn || cancelled) { setWishLoading(false); return; }

        const wRes = await fetch("/api/wishlist");
        const wData = await wRes.json() as { games?: WishSaleGame[]; error?: string };
        if (!cancelled && !wData.error) {
          setWishSale((wData.games ?? []).filter((g) => g.onSale));
        }
      } catch {
        // 네트워크 오류 등
      } finally {
        if (!cancelled) setWishLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetch("/api/deals?limit=20")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || data?.error) throw new Error(data?.error ?? `HTTP ${r.status}`);
        return data as DealItem[];
      })
      .then((data) => {
        setRawDeals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setLoading(false);
        setError(e instanceof Error ? e.message : "알 수 없는 오류");
      });
  }, []);

  useEffect(() => {
    fetch("/api/deals?limit=8&sort=expiry")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || data?.error) throw new Error();
        return data as DealItem[];
      })
      .then((data) => {
        const withExpiry = (Array.isArray(data) ? data : []).filter((d) => d.deal.expiry);
        setEndingDeals(withExpiry.slice(0, 4));
        setEndingLoading(false);
      })
      .catch(() => setEndingLoading(false));
  }, []);

  return (
    <div>
      <Nav />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 22px" }}>

        {/* hero — search only */}
        <div style={{ padding: "40px 0 32px" }}>
          {/* sale banner */}
          {(() => {
            const sale = detectSale();
            const saleUntil = getSaleUntil(rawDeals);
            if (!sale || (rawDeals.length === 0 && !loading)) return null;
            return (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: sale.bg, border: `1px solid ${sale.border}`,
                  borderRadius: 12, padding: "10px 20px",
                }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{sale.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: sale.color, letterSpacing: -0.2 }}>
                    {sale.label}
                  </span>
                  {saleUntil && (
                    <>
                      <span style={{ width: 1, height: 14, background: sale.border, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: sale.color, opacity: 0.75 }}>
                        {saleUntil}
                      </span>
                    </>
                  )}
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: sale.color, flexShrink: 0,
                    boxShadow: `0 0 6px ${sale.color}`,
                    animation: "pulse 1.8s ease-in-out infinite",
                  }} />
                </div>
              </div>
            );
          })()}
          <HeroSearch />
        </div>

        {/* ─── 찜목록 할인 중 ─── */}
        {(wishLoading || wishSale.length > 0) && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#eef6f0", letterSpacing: -0.4, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#e8705f" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              내 찜목록 할인 중
              <span style={{ fontSize: 12, fontWeight: 500, color: "#7e827f" }}>({wishSale.length}개)</span>
            </div>
            <div className="wish-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
              {wishLoading
                ? Array.from({ length: 4 }, (_, i) => (
                    <div key={i} style={{ flexShrink: 0, width: 180, background: "#141716", border: "1px solid #272d2d", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ height: 90, background: "repeating-linear-gradient(45deg,transparent 0 12px,rgba(32,36,34,.55) 12px 24px),linear-gradient(135deg,#1c1f1e,#141716)" }} />
                      <div style={{ padding: "11px 13px" }}>
                        <div style={{ height: 13, borderRadius: 5, background: "#1e2222", width: "70%", marginBottom: 8 }} />
                        <div style={{ height: 18, borderRadius: 5, background: "#1e2a22", width: "50%" }} />
                      </div>
                    </div>
                  ))
                : wishSale.map((g) => {
                    const imgSrc = g.capsule
                      ?? `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appId}/header.jpg`;
                    return (
                      <Link
                        key={g.appId}
                        href={`/game/${g.itadId}?title=${encodeURIComponent(g.title)}&appid=${g.appId}`}
                        style={{ flexShrink: 0, width: 180, background: "#141716", border: "1px solid #272d2d", borderRadius: 12, overflow: "hidden", textDecoration: "none" }}
                      >
                        <div style={{ height: 90, background: "#1a1d1d", overflow: "hidden", position: "relative" }}>
                          <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <span style={{
                            position: "absolute", top: 7, right: 7,
                            fontSize: 11, fontWeight: 800, color: "#07120b",
                            background: "#5fd39a", padding: "2px 7px", borderRadius: 5,
                            fontFamily: "'IBM Plex Mono',monospace",
                          }}>-{g.disc}%</span>
                          {g.isAllTimeLow && (
                            <span style={{
                              position: "absolute", top: 7, left: 7,
                              fontSize: 9.5, fontWeight: 800, color: "#06120b",
                              background: "#ffb454", padding: "2px 6px", borderRadius: 4,
                            }}>역대최저</span>
                          )}
                        </div>
                        <div style={{ padding: "10px 12px" }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#e6ebe8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 5 }}>
                            {g.title}
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, fontWeight: 700, color: "#5fd39a" }}>{won(g.now)}</span>
                            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#4a504d", textDecoration: "line-through" }}>{won(g.old)}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
              }
            </div>
          </div>
        )}

        {/* ─── 할인 중인 게임 (SteamDB-style table) ─── */}
        <div style={{ margin: "42px 0 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 21, fontWeight: 800, color: "#eef6f0", letterSpacing: -0.4, display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5fd39a" strokeWidth="2">
              <path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 12 10 12 2z" />
            </svg>
            할인 중인 게임
            {loading && (
              <span style={{ fontSize: 12, color: "#5a615d", fontWeight: 400, letterSpacing: 0 }}>
                불러오는 중…
              </span>
            )}
          </div>
          {error && (
            <span style={{ fontSize: 12, color: "#e8705f", fontWeight: 600, background: "rgba(232,112,95,.1)", border: "1px solid rgba(232,112,95,.25)", padding: "4px 10px", borderRadius: 7 }}>
              오류: {error}
            </span>
          )}
        </div>

        {/* table */}
        <div style={{
          background: "linear-gradient(180deg,#141716,#101212)",
          border: "1px solid #1e2424", borderRadius: 12,
          overflow: "hidden",
        }}>
          <DealTableHeader />
          {loading
            ? Array.from({ length: 10 }, (_, i) => <SkeletonRow key={i} i={i} />)
            : error
              ? (
                <div style={{ padding: "52px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                  <div style={{ fontSize: 14, color: "#7e827f", lineHeight: 1.7 }}>
                    Steam 할인 목록을 불러오지 못했습니다<br />
                    <span style={{ fontSize: 12, color: "#4a504d" }}>{error}</span>
                  </div>
                </div>
              )
              : rawDeals.length === 0
                ? (
                  <div style={{ padding: "52px 0", textAlign: "center", color: "#5a615d", fontSize: 14 }}>
                    현재 Steam 할인 중인 게임이 없습니다
                  </div>
                )
                : rawDeals.map((item, i) => (
                  <DealRow key={item.id} item={item} rank={i + 1} isOdd={i % 2 !== 0} />
                ))
          }
        </div>

        {/* split */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 22, alignItems: "start", marginTop: 8 }}>

          {/* 곧 끝나는 세일 */}
          <div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", margin: "42px 0 18px" }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: "#eef6f0", letterSpacing: -0.4, display: "flex", alignItems: "center", gap: 9 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffb454" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                </svg>
                곧 끝나는 세일
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              {endingLoading
                ? Array.from({ length: 4 }, (_, i) => <SkeletonEndingCard key={i} />)
                : endingDeals.length === 0
                  ? (
                    <div style={{ gridColumn: "1/-1", padding: "28px 0", textAlign: "center", color: "#5a615d", fontSize: 13 }}>
                      현재 마감 임박 세일이 없습니다
                    </div>
                  )
                  : endingDeals.map((e) => {
                    const r = remainSec(e.deal.expiry);
                    void tick;
                    return (
                      <Link key={e.id} href={`/game/${e.id}?title=${encodeURIComponent(e.title)}`} style={{
                        background: "linear-gradient(180deg,#141716,#101212)",
                        border: "1px solid #272d2d", borderRadius: 13,
                        padding: 13, display: "flex", gap: 12, alignItems: "center",
                        textDecoration: "none",
                      }}>
                        <div style={{ width: 54, height: 54, borderRadius: 9, overflow: "hidden", background: CAP_SM, flexShrink: 0, border: "1px solid #272d2d" }}>
                          {(() => {
                            const eid = steamAppIdFromUrl(e.deal.url);
                            const esrc = e.assets?.boxart ?? (eid ? steamHeaderUrl(eid) : null);
                            return esrc ? (
                              <img
                                src={esrc}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(ev) => {
                                  const img = ev.target as HTMLImageElement;
                                  const fb = eid ? steamHeaderUrl(eid) : null;
                                  if (fb && img.src !== fb) { img.src = fb; }
                                  else { img.style.display = "none"; }
                                }}
                              />
                            ) : null;
                          })()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#e6ebe8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#ffb454", fontFamily: "'IBM Plex Mono',monospace", marginTop: 5, letterSpacing: 0.3 }}>
                            ⏳ {fmtCd(r)} 남음
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600, color: "#5fd39a" }}>-{e.deal.cut}%</div>
                          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, fontWeight: 700, color: "#e6ebe8", marginTop: 3 }}>{won(e.deal.price.amount)}</div>
                        </div>
                      </Link>
                    );
                  })
              }
            </div>
          </div>

          {/* 역대최저 갱신 중 */}
          {(() => {
            const lowGames  = rawDeals.filter((d) => d.deal.flag === "H" || d.deal.flag === "N");
            const restGames = rawDeals.filter((d) => d.deal.flag !== "H" && d.deal.flag !== "N");
            const topGames  = [...lowGames, ...restGames].slice(0, 6);
            const hasLow    = lowGames.length > 0;
            return (
              <div>
                <div style={{ fontSize: 21, fontWeight: 800, color: "#eef6f0", letterSpacing: -0.4, display: "flex", alignItems: "center", gap: 9, margin: "42px 0 18px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5fd39a" strokeWidth="2">
                    <path d="M3 17l5-5 4 3 7-8" /><path d="M21 7v5h-5" />
                  </svg>
                  {hasLow ? "역대최저 갱신 중" : "할인율 TOP 게임"}
                </div>
                <div style={{ background: "linear-gradient(180deg,#141716,#101212)", border: "1px solid #272d2d", borderRadius: 14, padding: "0 18px" }}>
                  {loading
                    ? Array.from({ length: 6 }, (_, i) => <SkeletonTrackedRow key={i} />)
                    : topGames.length === 0
                      ? (
                        <div style={{ padding: "32px 0", textAlign: "center", color: "#5a615d", fontSize: 13 }}>
                          데이터를 불러오는 중입니다
                        </div>
                      )
                      : topGames.map((item, i) => {
                        const isLow = item.deal.flag === "H" || item.deal.flag === "N";
                        return (
                          <Link
                            key={item.id}
                            href={`/game/${item.id}?title=${encodeURIComponent(item.title)}`}
                            style={{
                              display: "flex", alignItems: "center", gap: 13, padding: "12px 0",
                              borderTop: i === 0 ? "none" : "1px solid #1e2222",
                              textDecoration: "none",
                            }}
                          >
                            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 700, color: "#3d4440", width: 18, textAlign: "center", flexShrink: 0 }}>
                              {i + 1}
                            </span>
                            <div style={{ width: 38, height: 38, borderRadius: 8, overflow: "hidden", background: CAP_XS, flexShrink: 0, border: "1px solid #272d2d" }}>
                              {(() => {
                                const aid = steamAppIdFromUrl(item.deal.url);
                                const src = item.assets?.boxart ?? (aid ? steamHeaderUrl(aid) : null);
                                return src ? (
                                  <img
                                    src={src}
                                    alt=""
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      const fb = aid ? steamHeaderUrl(aid) : null;
                                      if (fb && img.src !== fb) { img.src = fb; }
                                      else { img.style.display = "none"; }
                                    }}
                                  />
                                ) : null;
                              })()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#e6ebe8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {item.title}
                              </div>
                              {isLow && (
                                <span style={{ fontSize: 9.5, fontWeight: 800, color: "#06120b", background: "#5fd39a", padding: "1px 5px", borderRadius: 4, marginTop: 3, display: "inline-block" }}>
                                  역대최저
                                </span>
                              )}
                            </div>
                            <span style={{
                              fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700,
                              color: "#07120b", background: discountColor(item.deal.cut),
                              padding: "2px 6px", borderRadius: 5, flexShrink: 0,
                            }}>
                              -{item.deal.cut}%
                            </span>
                            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 700, color: "#5fd39a", width: 72, textAlign: "right", flexShrink: 0 }}>
                              {won(item.deal.price.amount)}
                            </div>
                          </Link>
                        );
                      })
                  }
                </div>
              </div>
            );
          })()}


        </div>
      </div>
    </div>
  );
}
