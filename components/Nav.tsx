"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { GameSearchResult } from "@/lib/itad";
import { useTheme } from "@/app/theme-provider";

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7e827f" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

function SteamIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.187.008l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z" />
    </svg>
  );
}

function NavSearchBox() {
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
    <div ref={wrapRef} style={{ position: "relative", flex: 1, maxWidth: 420 }}>
      <div style={{
        height: 38,
        background: "#141616",
        border: `1px solid ${showDropdown ? "#2c4135" : "#272d2d"}`,
        borderRadius: showDropdown ? "9px 9px 0 0" : 9,
        display: "flex", alignItems: "center", gap: 9, padding: "0 13px",
        transition: "border-color .15s",
      }}>
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" && results[0]) pick(results[0]); if (e.key === "Escape") setOpen(false); }}
          placeholder="게임 검색…"
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: "#cfd3d0", fontSize: 13, fontFamily: "'Noto Sans KR', system-ui, sans-serif",
          }}
        />
        {loading && (
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: "spin .7s linear infinite", flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5.5" fill="none" stroke="#2c4135" strokeWidth="2" />
            <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#5fd39a" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        )}
      </div>
      {showDropdown && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#141716", border: "1px solid #2c4135", borderTop: "none",
          borderRadius: "0 0 10px 10px",
          zIndex: 100, overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,.55)",
        }}>
          {loading && results.length === 0 ? (
            <div style={{ padding: "11px 13px", color: "#7e827f", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span>검색 중…</span>
            </div>
          ) : results.length > 0 ? (
            results.map((g, i) => (
              <button
                key={g.id}
                onClick={() => pick(g)}
                style={{
                  display: "flex", alignItems: "center", gap: 11,
                  width: "100%", padding: "9px 13px",
                  background: "none", border: "none",
                  borderBottom: i < results.length - 1 ? "1px solid #1e2222" : "none",
                  cursor: "pointer", textAlign: "left",
                  color: "#cfd3d0", fontSize: 13, fontWeight: 600,
                  fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(67,194,130,.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
              >
                {g.assets?.boxart ? (
                  <img src={g.assets.boxart} alt="" style={{ width: 40, height: 28, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <span style={{ width: 40, height: 28, borderRadius: 5, background: "#1a1d1d", flexShrink: 0, display: "inline-block" }} />
                )}
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</span>
              </button>
            ))
          ) : searched ? (
            <div style={{ padding: "11px 13px", color: "#7e827f", fontSize: 12 }}>
              검색 결과가 없습니다
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

interface SteamProfile { name: string; avatar: string }

const NAV_LINK_STYLE = {
  fontSize: 14, fontWeight: 600, color: "#a3a8a4", textDecoration: "none",
} as const;

const DROP_LINK_BASE = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "10px 16px",
  fontSize: 13, fontWeight: 600, color: "#cfd3d0",
  textDecoration: "none", background: "transparent",
} as const;

export default function Nav() {
  const [profile, setProfile] = useState<SteamProfile | null>(null);
  const { theme, toggle } = useTheme();
  const [dropOpen, setDropOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openDrop() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDropOpen(true);
  }
  function scheduleDrop() {
    closeTimer.current = setTimeout(() => setDropOpen(false), 120);
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { loggedIn: boolean; steamName?: string; steamAvatar?: string }) => {
        if (d.loggedIn) {
          setProfile({ name: d.steamName ?? "Steam 유저", avatar: d.steamAvatar ?? "" });
        }
      })
      .catch(() => {});
  }, []);

  const avatarEl = (size: number, radius: number) => (
    <div style={{
      width: size, height: size, borderRadius: radius, overflow: "hidden",
      background: "#1e2424", border: "1.5px solid rgba(67,194,130,.35)", flexShrink: 0,
    }}>
      {profile?.avatar ? (
        <img
          src={profile.avatar}
          alt={profile.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.43, fontWeight: 700, color: "#5fd39a" }}>
          {profile?.name.charAt(0).toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );

  return (
    <nav className="site-nav" style={{ position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto", height: 60,
        padding: "0 22px", display: "flex", alignItems: "center", gap: 18,
      }}>
        {/* 로고 */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 9, flexShrink: 0,
          fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px", color: "#eef6f0",
          textDecoration: "none",
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            background: "linear-gradient(135deg,#43c282,#1d7a52)",
            boxShadow: "0 0 14px rgba(67,194,130,.45)",
          }} />
          스팀 최저가 트래커
        </Link>

        {/* 검색 */}
        <NavSearchBox />

        {/* 오른쪽 메뉴 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16, flexShrink: 0,
          marginLeft: "auto",
        }}>
          <Link href="/" style={NAV_LINK_STYLE}>핫딜</Link>
          <Link href="/sales" style={NAV_LINK_STYLE}>세일 일정</Link>
          <Link href="/deals" style={NAV_LINK_STYLE}>할인 전체</Link>

          {profile ? (
            /* 로그인 상태 — 호버 드롭다운 */
            <div
              style={{ position: "relative" }}
              onMouseEnter={openDrop}
              onMouseLeave={scheduleDrop}
            >
              {/* 트리거: 아바타 + 이름 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                {avatarEl(30, 8)}
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e6ebe8", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile.name}
                </span>
              </div>

              {/* 드롭다운 */}
              {dropOpen && (
                <div
                  onMouseEnter={openDrop}
                  onMouseLeave={scheduleDrop}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    minWidth: 220,
                    background: "#141716",
                    border: "1px solid #2c4135",
                    borderRadius: 12,
                    boxShadow: "0 16px 50px rgba(0,0,0,.6)",
                    zIndex: 200,
                    overflow: "hidden",
                    padding: 0,
                  }}
                >
                  {/* 1. 프로필 헤더 */}
                  <Link
                    href="/profile"
                    style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 16px", textDecoration: "none", background: "transparent" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(67,194,130,.05)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                  >
                    {avatarEl(32, 8)}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e6ebe8" }}>{profile.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#5fd39a", marginTop: 2 }}>마이페이지 →</div>
                    </div>
                  </Link>

                  {/* 2. 구분선 */}
                  <div style={{ height: 1, background: "#1e2424", margin: "0 12px" }} />

                  {/* 3. 테마 토글 */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#cfd3d0" }}>
                      {theme === "dark" ? "🌙 다크 모드" : "☀️ 라이트 모드"}
                    </span>
                    <button
                      onClick={toggle}
                      aria-label="테마 변경"
                      style={{
                        position: "relative",
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        border: "none",
                        cursor: "pointer",
                        background: theme === "dark" ? "#2c3630" : "#5fd39a",
                        transition: "background 0.2s",
                        flexShrink: 0,
                        padding: 0,
                      }}
                    >
                      <span style={{
                        position: "absolute",
                        top: "4px",
                        left: theme === "dark" ? "4px" : "calc(100% - 20px)",
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.2s",
                        display: "block",
                      }} />
                    </button>
                  </div>

                  {/* 4. 구분선 */}
                  <div style={{ height: 1, background: "#1e2424", margin: "0 12px" }} />

                  {/* 5. 마이페이지 */}
                  <Link
                    href="/profile"
                    style={DROP_LINK_BASE}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(67,194,130,.06)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                  >
                    <span>👤</span><span>마이페이지</span>
                  </Link>

                  {/* 6. 찜목록 */}
                  <Link
                    href="/wishlist"
                    style={DROP_LINK_BASE}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(67,194,130,.06)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                  >
                    <span>🔖</span><span>찜목록</span>
                  </Link>

                  {/* 7. 피드백 */}
                  <Link
                    href="/feedback"
                    style={DROP_LINK_BASE}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(67,194,130,.06)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                  >
                    <span>📋</span><span>피드백</span>
                  </Link>

                  {/* 8. 구분선 */}
                  <div style={{ height: 1, background: "#1e2424", margin: "0 12px" }} />

                  {/* 9. 로그아웃 */}
                  <form action="/api/auth/logout" method="POST" style={{ margin: 0 }}>
                    <button
                      type="submit"
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "11px 16px",
                        fontSize: 13, fontWeight: 600, color: "#7e827f",
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,112,95,.06)";
                        (e.currentTarget as HTMLButtonElement).style.color = "#e8705f";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = "#7e827f";
                      }}
                    >
                      <span>↪</span><span>로그아웃</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* 비로그인 상태 */
            <>
              <button
                onClick={toggle}
                aria-label="테마 변경"
                style={{
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#141616", border: "1px solid #272d2d",
                  borderRadius: 8, cursor: "pointer", fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <Link href="/feedback" style={NAV_LINK_STYLE}>피드백</Link>
              <a
                href="/api/auth/steam"
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  fontSize: 13, fontWeight: 700, color: "#c7d5e0",
                  background: "#1b2838", border: "1px solid #2a475e",
                  padding: "7px 14px", borderRadius: 8, textDecoration: "none",
                }}
              >
                <SteamIcon />
                Steam 로그인
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
