"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

interface WishGame {
  appId: number;
  title: string;
  capsule?: string;
  itadId: string;
  now: number;
  old: number;
  disc: number;
  histLow: number | null;
  isAllTimeLow: boolean;
  onSale: boolean;
  shopUrl: string;
  shop: string;
  expiry: string | null;
}

interface WishlistData {
  games: WishGame[];
  total: number;
  matched: number;
}

function won(n: number) { return "₩" + n.toLocaleString("ko-KR"); }

const CAP_BG = "repeating-linear-gradient(45deg,transparent 0 14px,rgba(32,36,34,.55) 14px 28px),linear-gradient(135deg,#1c1f1e,#141716)";

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: "1px solid #1e2222" }}>
      <div style={{ width: 60, height: 42, borderRadius: 8, background: CAP_BG, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 14, borderRadius: 5, background: "#1e2222", width: "50%", marginBottom: 7 }} />
        <div style={{ height: 11, borderRadius: 4, background: "#181a1a", width: "30%" }} />
      </div>
      <div style={{ width: 90, textAlign: "right" }}>
        <div style={{ height: 11, borderRadius: 4, background: "#1e2a22", marginBottom: 6, width: "60%", marginLeft: "auto" }} />
        <div style={{ height: 18, borderRadius: 5, background: "#1e2222" }} />
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const [data, setData] = useState<WishlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "sale" | "low">("all");

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); }
        else { setData(d); }
      })
      .catch(() => setError("네트워크 오류가 발생했습니다."))
      .finally(() => setLoading(false));
  }, []);

  /* ── 로그인 안 된 경우 ── */
  if (!loading && error?.includes("로그인")) {
    return (
      <div>
        <Nav />
        <div style={{ maxWidth: 640, margin: "100px auto", padding: "0 22px", textAlign: "center" }}>
          <div style={{
            background: "linear-gradient(180deg,#141716,#101212)",
            border: "1px solid #272d2d", borderRadius: 18, padding: "48px 40px",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#eef6f0", marginBottom: 12 }}>
              Steam으로 로그인하세요
            </h1>
            <p style={{ fontSize: 14, color: "#8b8f8b", lineHeight: 1.7, marginBottom: 32 }}>
              Steam 계정으로 로그인하면<br />
              찜목록의 게임 할인 정보를 한 눈에 확인할 수 있습니다
            </p>

            <a
              href="/api/auth/steam"
              style={{
                display: "inline-flex", alignItems: "center", gap: 11,
                background: "#1b2838", border: "1px solid #2a475e",
                color: "#c7d5e0", fontSize: 15, fontWeight: 700,
                padding: "13px 28px", borderRadius: 11, textDecoration: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,.4)",
              }}
            >
              <SteamIcon />
              Steam으로 로그인
            </a>

            <div style={{ marginTop: 24, fontSize: 12, color: "#5a615d", lineHeight: 1.8 }}>
              ⚠️ Steam 개인정보 설정에서<br />
              <strong style={{ color: "#8b8f8b" }}>위시리스트를 '공개'</strong>로 설정해야 가져올 수 있습니다
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── 에러 ── */
  if (!loading && error) {
    return (
      <div>
        <Nav />
        <div style={{ maxWidth: 640, margin: "80px auto", padding: "0 22px", textAlign: "center" }}>
          <div style={{ background: "linear-gradient(180deg,#1e1414,#101212)", border: "1px solid #3d2222", borderRadius: 14, padding: "36px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#e8705f", marginBottom: 8 }}>오류 발생</div>
            <div style={{ fontSize: 13, color: "#a3a8a4", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{error}</div>
            <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center" }}>
              <form action="/api/auth/logout" method="POST" style={{ margin: 0 }}>
                <button type="submit" style={{ fontSize: 13, fontWeight: 600, color: "#8b8f8b", background: "#1a1d1a", border: "1px solid #272d2d", padding: "9px 20px", borderRadius: 9, cursor: "pointer", fontFamily: "'Noto Sans KR',system-ui,sans-serif" }}>
                  로그아웃 후 재시도
                </button>
              </form>
              <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: "#cfd3d0", background: "#1e2222", border: "1px solid #272d2d", padding: "9px 20px", borderRadius: 9, textDecoration: "none" }}>
                홈으로
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filtered = (data?.games ?? []).filter((g) => {
    if (filter === "sale") return g.onSale;
    if (filter === "low")  return g.isAllTimeLow;
    return true;
  });

  const onSaleCount = data?.games.filter((g) => g.onSale).length ?? 0;
  const lowCount    = data?.games.filter((g) => g.isAllTimeLow).length ?? 0;

  return (
    <div>
      <Nav />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 22px 60px" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#eef6f0", letterSpacing: -0.5 }}>
              🎮 내 찜목록
            </h1>
            {data && (
              <p style={{ fontSize: 13, color: "#7e827f", marginTop: 6 }}>
                전체 {data.total}개 · ITAD 매칭 {data.matched}개 · 할인 중 {onSaleCount}개 · 역대최저 {lowCount}개
              </p>
            )}
          </div>
          <form action="/api/auth/logout" method="POST" style={{ margin: 0 }}>
            <button
              type="submit"
              style={{
                fontSize: 13, fontWeight: 600, color: "#8b8f8b",
                background: "#1a1d1a", border: "1px solid #272d2d",
                padding: "8px 16px", borderRadius: 9, cursor: "pointer",
                fontFamily: "'Noto Sans KR',system-ui,sans-serif",
              }}
            >
              로그아웃
            </button>
          </form>
        </div>

        {/* 필터 탭 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { key: "all",  label: "전체" },
            { key: "sale", label: `할인 중 ${onSaleCount > 0 ? `(${onSaleCount})` : ""}` },
            { key: "low",  label: `역대 최저 ${lowCount > 0 ? `(${lowCount})` : ""}` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              style={{
                fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 9,
                background: filter === key ? "rgba(67,194,130,.16)" : "#141716",
                color: filter === key ? "#7fe3b0" : "#828783",
                border: filter === key ? "1px solid rgba(67,194,130,.35)" : "1px solid #272d2d",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 목록 */}
        <div style={{ background: "linear-gradient(180deg,#141716,#101212)", border: "1px solid #272d2d", borderRadius: 14, padding: "0 22px" }}>
          {loading
            ? Array.from({ length: 10 }, (_, i) => <SkeletonRow key={i} />)
            : filtered.length === 0
              ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: "#5a615d", fontSize: 14 }}>
                  {filter === "all" ? "게임을 찾을 수 없습니다" : "해당 조건의 게임이 없습니다"}
                </div>
              )
              : filtered.map((g, i) => (
                <div
                  key={g.appId}
                  style={{
                    display: "flex", alignItems: "center", gap: 16, padding: "14px 0",
                    borderBottom: i < filtered.length - 1 ? "1px solid #1e2222" : "none",
                  }}
                >
                  {/* 썸네일 */}
                  <div style={{ width: 60, height: 42, borderRadius: 8, overflow: "hidden", background: CAP_BG, flexShrink: 0 }}>
                    {g.capsule && (
                      <img src={g.capsule} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>

                  {/* 제목 + 뱃지 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <Link
                        href={`/game/${g.itadId}?title=${encodeURIComponent(g.title)}`}
                        style={{ fontSize: 14, fontWeight: 700, color: "#e6ebe8", textDecoration: "none" }}
                      >
                        {g.title}
                      </Link>
                      {g.isAllTimeLow && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#06120b", background: "#5fd39a", padding: "2px 7px", borderRadius: 5 }}>
                          역대 최저
                        </span>
                      )}
                      {g.onSale && !g.isAllTimeLow && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#0a120d", background: "#43c282", padding: "2px 7px", borderRadius: 5 }}>
                          할인 중
                        </span>
                      )}
                      {!g.onSale && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#5a615d", background: "#181a1a", border: "1px solid #272d2d", padding: "2px 7px", borderRadius: 5 }}>
                          정가
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#7e827f", marginTop: 3 }}>
                      {g.shop}
                      {g.histLow != null && (
                        <span style={{ marginLeft: 8 }}>역대최저 {won(g.histLow)}</span>
                      )}
                    </div>
                  </div>

                  {/* 가격 */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {g.onSale ? (
                      <>
                        <div style={{ fontSize: 11, color: "#7e827f", textDecoration: "line-through", fontFamily: "'IBM Plex Mono',monospace" }}>
                          {won(g.old)}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#06120b", background: "#5fd39a", padding: "2px 6px", borderRadius: 5, fontFamily: "'IBM Plex Mono',monospace" }}>
                            -{g.disc}%
                          </span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#5fd39a", fontFamily: "'IBM Plex Mono',monospace" }}>
                            {won(g.now)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#a3a8a4", fontFamily: "'IBM Plex Mono',monospace" }}>
                        {won(g.now)}
                      </div>
                    )}
                  </div>

                  {/* Steam 이동 버튼 */}
                  {g.onSale && (
                    <a
                      href={g.shopUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flexShrink: 0, fontSize: 12, fontWeight: 700,
                        color: "#06120b", background: "#5fd39a",
                        padding: "7px 14px", borderRadius: 8,
                        textDecoration: "none", whiteSpace: "nowrap",
                      }}
                    >
                      구매 →
                    </a>
                  )}
                </div>
              ))
          }
        </div>

        {/* 안내 */}
        {!loading && data && (
          <div style={{ marginTop: 16, fontSize: 11.5, color: "#5a615d", lineHeight: 1.8 }}>
            찜목록 전체 {data.total}개 중 최대 40개를 처리합니다. ITAD 데이터베이스에 없는 게임은 목록에서 제외됩니다.
          </div>
        )}
      </div>
    </div>
  );
}

function SteamIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.187.008l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z" />
    </svg>
  );
}
