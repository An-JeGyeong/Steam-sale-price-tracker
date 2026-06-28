"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import DealCard, { type DealData } from "@/components/DealCard";
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

function dealItemToCard(item: DealItem): DealData {
  const reg = item.deal.regular.amount;
  const now = item.deal.price.amount;
  return {
    id: item.id,
    name: item.title,
    tags: item.deal.shop.name,
    old: reg,
    now,
    disc: item.deal.cut,
    low: item.deal.flag === "H",
    spark: [reg, Math.round(reg * 0.85), Math.round(reg * 0.7), now],
    boxart: item.assets?.boxart,
  };
}

const CAP_SM = "repeating-linear-gradient(45deg,transparent 0 10px,rgba(32,36,34,.55) 10px 20px),linear-gradient(135deg,#1c1f1e,#141716)";
const CAP_XS = "repeating-linear-gradient(45deg,transparent 0 9px,rgba(32,36,34,.55) 9px 18px),linear-gradient(135deg,#1c1f1e,#141716)";

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

/* ── skeleton card ── */
function SkeletonCard() {
  return (
    <div style={{
      background: "linear-gradient(180deg,#141716,#101212)",
      border: "1px solid #272d2d", borderRadius: 14, overflow: "hidden",
    }}>
      <div style={{ height: 104, background: CAP_SM }} />
      <div style={{ padding: "13px 14px" }}>
        <div style={{ height: 16, borderRadius: 6, background: "#1e2222", width: "75%", marginBottom: 8 }} />
        <div style={{ height: 11, borderRadius: 5, background: "#181a1a", width: "45%", marginBottom: 14 }} />
        <div style={{ height: 34, borderRadius: 5, background: "#1a1d1a" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
          <div style={{ height: 22, width: 52, borderRadius: 6, background: "#1e2a22" }} />
          <div style={{ height: 22, width: 80, borderRadius: 6, background: "#1e2222" }} />
        </div>
      </div>
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
                <img src={g.assets.boxart} alt="" style={{ width: 46, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
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

/* ── main page ── */
export default function HomePage() {
  const [tick, setTick] = useState(0);
  const [rawDeals, setRawDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const deals: DealData[] = rawDeals.map(dealItemToCard);

  /* deals with expiry — sorted soonest-first */
  const endingItems = rawDeals
    .filter((d) => d.deal.expiry)
    .sort((a, b) => new Date(a.deal.expiry!).getTime() - new Date(b.deal.expiry!).getTime())
    .slice(0, 4);

  /* fallback ending: first 4 deals when no expiry data */
  const endingFallback = rawDeals.slice(0, 4);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetch("/api/deals?limit=8")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: DealItem[]) => {
        setRawDeals(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  }, []);

  const showEnding = endingItems.length > 0 ? endingItems : endingFallback;

  return (
    <div>
      <Nav />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 22px" }}>

        {/* hero */}
        <div style={{ textAlign: "center", padding: "54px 0 40px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            fontSize: 12, fontWeight: 700, color: "#5fd39a",
            background: "rgba(67,194,130,.1)", border: "1px solid rgba(67,194,130,.22)",
            padding: "6px 13px", borderRadius: 20,
          }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, flexShrink: 0, background: "linear-gradient(135deg,#43c282,#1d7a52)", boxShadow: "0 0 14px rgba(67,194,130,.45)" }} />
            Steam 전용 가격 추적
          </span>
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, color: "#f2f8f4", margin: "18px 0 0", lineHeight: 1.18 }}>
            지금 사도 될까?<br />
            <span style={{ color: "#5fd39a" }}>역대 최저가</span>로 답을 드립니다
          </h1>
          <p style={{ fontSize: 15, color: "#8b8f8b", marginTop: 12 }}>
            Steam 게임의 가격 변동을 추적하고, 최저가일 때 알림을 받아보세요
          </p>
          <HeroSearch />
          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 30 }}>
            {[
              { val: "72,418", label: "추적 중인 게임" },
              { val: "1,204",  label: "오늘 최저가 갱신" },
              { val: "평균 -58%", label: "현재 핫딜 할인율" },
            ].map(({ val, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'IBM Plex Mono',monospace", color: "#5fd39a" }}>{val}</div>
                <div style={{ fontSize: 12, color: "#7e827f", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘의 핫딜 */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", margin: "42px 0 18px" }}>
          <div style={{ fontSize: 21, fontWeight: 800, color: "#eef6f0", letterSpacing: -0.4, display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5fd39a" strokeWidth="2">
              <path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 12 10 12 2z" />
            </svg>
            오늘의 핫딜
            {loading && <span style={{ fontSize: 12, color: "#5a615d", fontWeight: 400 }}>불러오는 중…</span>}
            {error  && <span style={{ fontSize: 12, color: "#e8705f", fontWeight: 400 }}>API 오류</span>}
          </div>
          <a href="#" className="smore" style={{ fontSize: 13, fontWeight: 600, color: "#7e827f" }}>전체 보기 →</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {loading
            ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
            : deals.map((g) => <DealCard key={g.id} game={g} />)
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
              <a href="#" className="smore" style={{ fontSize: 13, fontWeight: 600, color: "#7e827f" }}>전체 보기 →</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              {loading
                ? Array.from({ length: 4 }, (_, i) => <SkeletonEndingCard key={i} />)
                : showEnding.map((e) => {
                  const r = e.deal.expiry ? remainSec(e.deal.expiry) : 0;
                  /* suppress tick warning — tick is used to re-render every second */
                  void tick;
                  return (
                    <Link key={e.id} href={`/game/${e.id}?title=${encodeURIComponent(e.title)}`} style={{
                      background: "linear-gradient(180deg,#141716,#101212)",
                      border: "1px solid #272d2d", borderRadius: 13,
                      padding: 13, display: "flex", gap: 12, alignItems: "center",
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
