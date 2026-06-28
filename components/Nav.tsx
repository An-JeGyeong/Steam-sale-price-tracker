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
        color: "#7e827f", fontSize: 13,
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
                <img src={g.assets.boxart} alt="" style={{ width: 40, height: 28, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} />
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

        <NavSearchBox />

        <div style={{
          display: "flex", alignItems: "center", gap: 20, flexShrink: 0,
          marginLeft: "auto", fontSize: 14, fontWeight: 600, color: "#a3a8a4",
        }}>
          <span style={{ cursor: "pointer" }}>핫딜</span>
          <span style={{ cursor: "pointer" }}>출시예정</span>
          <span style={{ cursor: "pointer" }}>위시리스트</span>
        </div>

        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,#2a302d,#191c1b)",
          border: "1px solid #2c4135",
        }} />
      </div>
    </nav>
  );
}
