"use client";

import { useEffect, useState, useRef, useCallback, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import type { GameSearchResult, DealItem } from "@/lib/itad";

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

const TRACKED = [
  { id: "1", name: "게임 X", tag: "액션 · 메트로배니아", now: 18150, dir: "down" as const, ch: "12%" },
  { id: "2", name: "게임 Y", tag: "RPG · 오픈월드",      now: 24500, dir: "up"   as const, ch: "5%"  },
  { id: "3", name: "게임 Z", tag: "인디 · 로그라이크",   now: 9600,  dir: "down" as const, ch: "30%" },
  { id: "4", name: "게임 W", tag: "전략 · 시뮬",         now: 7000,  dir: "flat" as const, ch: "0%"  },
  { id: "5", name: "게임 V", tag: "호러 · 생존",          now: 12600, dir: "down" as const, ch: "18%" },
  { id: "6", name: "게임 U", tag: "퍼즐 · 캐주얼",       now: 4500,  dir: "down" as const, ch: "22%" },
];

const TREND_MAP = {
  down: ["#5fd39a", "▼ -"] as const,
  up:   ["#e8705f", "▲ +"] as const,
  flat: ["#8b8f8b", "■ "]  as const,
};

const CAP_XS = "repeating-linear-gradient(45deg,transparent 0 9px,rgba(32,36,34,.55) 9px 18px),linear-gradient(135deg,#1c1f1e,#141716)";

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

/* ── hero search ── */
function HeroSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?title=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data: GameSearchResult[] = await res.json();
        setResults(data.slice(0, 6));
        setOpen(data.length > 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(query), 400);
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
    router.push(`/game/${game.id}?title=${encodeURIComponent(game.title)}`);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative", maxWidth: 560, margin: "26px auto 0" }}>
      <div style={{
        height: 54,
        background: "#141616", border: "1px solid #2c4135", borderRadius: 14,
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
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && results[0] && pick(results[0])}
          placeholder="게임 이름을 검색하세요"
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: "#cfd3d0", fontSize: 15, fontFamily: "'Pretendard',system-ui,sans-serif",
          }}
        />
        <button
          onClick={() => results[0] && pick(results[0])}
          style={{
            fontSize: 13, fontWeight: 700, color: "#06120b",
            background: "#5fd39a", padding: "9px 16px", borderRadius: 10,
            cursor: "pointer", border: "none", fontFamily: "'Pretendard',system-ui,sans-serif",
          }}
        >
          {loading ? "…" : "검색"}
        </button>
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
          background: "#141716", border: "1px solid #2c4135", borderRadius: 12,
          zIndex: 50, overflow: "hidden",
          boxShadow: "0 16px 50px rgba(0,0,0,.55)",
        }}>
          {results.map((g, i) => (
            <button
              key={g.id}
              onClick={() => pick(g)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "11px 16px",
                background: "none", border: "none",
                borderBottom: i < results.length - 1 ? "1px solid #1e2222" : "none",
                cursor: "pointer", textAlign: "left",
                color: "#cfd3d0", fontSize: 14, fontWeight: 600,
                fontFamily: "'Pretendard',system-ui,sans-serif",
              }}
            >
              {g.assets?.boxart ? (
                <img src={g.assets.boxart} alt="" style={{ width: 46, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span style={{ width: 46, height: 32, borderRadius: 6, background: "#1a1d1d", flexShrink: 0, display: "inline-block" }} />
              )}
              {g.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── deal table row ── */
function DealRow({ item, rank, isOdd }: { item: DealItem; rank: number; isOdd: boolean }) {
  const [hovered, setHovered] = useState(false);
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
          {item.assets?.boxart && (
            <img
              src={item.assets.boxart}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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

  const endingItems = rawDeals
    .filter((d) => d.deal.expiry)
    .sort((a, b) => new Date(a.deal.expiry!).getTime() - new Date(b.deal.expiry!).getTime())
    .slice(0, 4);

  const endingFallback = rawDeals.slice(0, 4);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
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

  const showEnding = endingItems.length > 0 ? endingItems : endingFallback;

  return (
    <div>
      <Nav />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 22px" }}>

        {/* hero — search only */}
        <div style={{ padding: "40px 0 32px" }}>
          <HeroSearch />
        </div>

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
              {loading
                ? Array.from({ length: 4 }, (_, i) => <SkeletonEndingCard key={i} />)
                : showEnding.map((e) => {
                  const r = e.deal.expiry ? remainSec(e.deal.expiry) : 0;
                  void tick;
                  return (
                    <Link key={e.id} href={`/game/${e.id}?title=${encodeURIComponent(e.title)}`} style={{
                      background: "linear-gradient(180deg,#141716,#101212)",
                      border: "1px solid #272d2d", borderRadius: 13,
                      padding: 13, display: "flex", gap: 12, alignItems: "center",
                      textDecoration: "none",
                    }}>
                      <div style={{ width: 54, height: 54, borderRadius: 9, overflow: "hidden", background: CAP_SM, flexShrink: 0, border: "1px solid #272d2d" }}>
                        {e.assets?.boxart && (
                          <img src={e.assets.boxart} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#e6ebe8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#ffb454", fontFamily: "'IBM Plex Mono',monospace", marginTop: 5, letterSpacing: 0.3 }}>
                          {e.deal.expiry ? `⏳ ${fmtCd(r)} 남음` : "⏳ 세일 진행 중"}
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

          {/* 많이 추적되는 게임 */}
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: "#eef6f0", letterSpacing: -0.4, display: "flex", alignItems: "center", gap: 9, margin: "42px 0 18px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5fd39a" strokeWidth="2">
                <path d="M3 17l5-5 4 3 7-8" /><path d="M21 7v5h-5" />
              </svg>
              많이 추적되는 게임
            </div>
            <div style={{ background: "linear-gradient(180deg,#141716,#101212)", border: "1px solid #272d2d", borderRadius: 14, padding: "8px 18px" }}>
              {TRACKED.map((t, i) => {
                const [col, pre] = TREND_MAP[t.dir];
                return (
                  <Link key={t.id} href={`/game/${t.id}`} style={{
                    display: "flex", alignItems: "center", gap: 13, padding: "13px 0",
                    borderTop: i === 0 ? "none" : "1px solid #1e2222",
                    textDecoration: "none",
                  }}>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, fontWeight: 700, color: "#5a615d", width: 18, textAlign: "center" }}>{i + 1}</span>
                    <span style={{ width: 38, height: 38, borderRadius: 8, background: CAP_XS, flexShrink: 0, border: "1px solid #272d2d", display: "inline-block" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#e6ebe8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "#7e827f", marginTop: 2 }}>{t.tag}</div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: "right", width: 62 }}>
                      <span style={{ color: col, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, fontSize: 12 }}>{pre}{t.ch}</span>
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, fontWeight: 700, color: "#5fd39a", width: 72, textAlign: "right", flexShrink: 0 }}>{won(t.now)}</div>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
