"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { GameSearchResult } from "@/lib/itad";

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
    <div ref={wrapRef} style={{ position: "relative", flex: 1, maxWidth: 420 }}>
      <div style={{
        height: 38,
        background: "#141616", border: "1px solid #272d2d", borderRadius: 9,
        display: "flex", alignItems: "center", gap: 9, padding: "0 13px",
      }}>
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="게임 검색…"
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: "#cfd3d0", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace",
          }}
        />
        {loading && <span style={{ fontSize: 10, color: "#5fd39a" }}>●</span>}
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "#141716", border: "1px solid #2c4135", borderRadius: 10,
          zIndex: 100, overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,.5)",
        }}>
          {results.map((g, i) => (
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
              }}
            >
              {g.assets?.boxart ? (
                <img src={g.assets.boxart} alt="" style={{ width: 40, height: 28, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span style={{ width: 40, height: 28, borderRadius: 5, background: "#1a1d1d", flexShrink: 0, display: "inline-block" }} />
              )}
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  const [steamId, setSteamId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.loggedIn) setSteamId(d.steamId); })
      .catch(() => {});
  }, []);

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 30,
      background: "rgba(13,15,14,.86)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid #222727",
    }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto", height: 60,
        padding: "0 22px", display: "flex", alignItems: "center", gap: 18,
      }}>
        {/* 로고 */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 9, flexShrink: 0,
          fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px", color: "#eef6f0",
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
          <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: "#a3a8a4", textDecoration: "none" }}>핫딜</Link>

          {steamId ? (
            /* 로그인 상태 */
            <>
              <Link
                href="/wishlist"
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  fontSize: 13, fontWeight: 700, color: "#5fd39a",
                  background: "rgba(67,194,130,.1)", border: "1px solid rgba(67,194,130,.25)",
                  padding: "6px 13px", borderRadius: 8, textDecoration: "none",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                찜목록
              </Link>
              <a
                href="/api/auth/logout"
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  fontSize: 12, fontWeight: 600, color: "#7e827f",
                  background: "#141616", border: "1px solid #272d2d",
                  padding: "6px 12px", borderRadius: 8, textDecoration: "none",
                }}
              >
                <SteamIcon />
                로그아웃
              </a>
            </>
          ) : (
            /* 로그아웃 상태 */
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
          )}
        </div>
      </div>
    </nav>
  );
}
