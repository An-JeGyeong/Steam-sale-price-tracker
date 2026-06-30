"use client";

import { useEffect, useState, useCallback, useMemo, type CSSProperties } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import type { DealItem } from "@/lib/itad";
import { steamAppIdFromUrl, steamHeaderUrl, steamCapsuleUrl } from "@/lib/itad";

const ITEMS_PER_PAGE = 20;

const CAP_SM =
  "repeating-linear-gradient(45deg,transparent 0 10px,rgba(32,36,34,.55) 10px 20px),linear-gradient(135deg,#1c1f1e,#141716)";

function isDlc(item: DealItem): boolean {
  if (item.type !== undefined) return item.type === "dlc";
  const lc = item.title.toLowerCase();
  return (
    /\bdlc\b/.test(lc) ||
    /\bsoundtrack\b/.test(lc) ||
    /\bseason pass\b/.test(lc) ||
    lc.endsWith(" ost")
  );
}

function discountColor(cut: number): string {
  if (cut >= 75) return "#5fd39a";
  if (cut >= 50) return "#43c282";
  if (cut >= 25) return "#e8b84b";
  return "var(--c-text-sub)";
}

function won(n: number) {
  return "₩" + n.toLocaleString("ko-KR");
}

/* ── 테이블 헤더 ── */
function DealTableHeader() {
  const CELL: CSSProperties = {
    fontSize: 11, fontWeight: 700, color: "var(--c-text-dim)",
    letterSpacing: 0.6, textTransform: "uppercase",
    fontFamily: "'IBM Plex Mono',monospace",
  };
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "40px 1fr 80px 100px 110px 96px",
      gap: 0,
      padding: "9px 16px",
      borderBottom: "1px solid var(--c-border-div2)",
      background: "var(--c-bg-header)",
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

/* ── 딜 행 ── */
function DealsRow({ item, rank, isOdd }: { item: DealItem; rank: number; isOdd: boolean }) {
  const [hovered, setHovered] = useState(false);
  const appId = steamAppIdFromUrl(item.deal.url) ?? steamAppIdFromUrl(item.assets?.boxart ?? "");
  const imgSrc = item.assets?.boxart ?? (appId ? steamHeaderUrl(appId) : null);
  const reg = item.deal.regular.amount;
  const now = item.deal.price.amount;
  const cut = item.deal.cut;
  const isLow = item.deal.flag === "H";
  const isDlcItem = isDlc(item);
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
        borderBottom: "1px solid var(--c-border-row)",
        alignItems: "center",
        textDecoration: "none",
        transition: "background 0.12s",
        cursor: "pointer",
      }}
    >
      {/* 순위 */}
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600, color: "var(--c-text-dimmer)" }}>
        {rank}
      </span>

      {/* 썸네일 + 제목 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ width: 56, height: 40, borderRadius: 7, overflow: "hidden", background: CAP_SM, flexShrink: 0 }}>
          {imgSrc && (
            <img
              src={imgSrc}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                const header = appId ? steamHeaderUrl(appId) : null;
                const capsule = appId ? steamCapsuleUrl(appId) : null;
                if (header && img.src !== header) { img.src = header; }
                else if (capsule && img.src !== capsule) { img.src = capsule; }
                else { img.style.display = "none"; }
              }}
            />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--c-text-alt2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.title}
          </div>
          {(isDlcItem || isLow) && (
            <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
              {isDlcItem && (
                <span style={{ display: "inline-block", fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4, color: "#b8c8dc", background: "#1e2e42", padding: "1.5px 6px", borderRadius: 4 }}>DLC</span>
              )}
              {isLow && (
                <span style={{ display: "inline-block", fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4, color: "#06120b", background: "#5fd39a", padding: "1.5px 6px", borderRadius: 4 }}>역대 최저</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 할인율 */}
      <div>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 50, padding: "4px 8px", borderRadius: 7, fontSize: 13, fontWeight: 800, color: "#07120b", background: col, fontFamily: "'IBM Plex Mono',monospace" }}>
          -{cut}%
        </span>
      </div>

      {/* 정가 */}
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 500, color: "var(--c-text-dim)", textDecoration: "line-through" }}>
        {won(reg)}
      </div>

      {/* 현재가 */}
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, fontWeight: 700, color: "#5fd39a" }}>
        {won(now)}
      </div>

      {/* 구매 */}
      <div>
        <a
          href={item.deal.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "#07120b", background: "#5fd39a", padding: "6px 12px", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap" }}
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

/* ── 스켈레톤 행 ── */
function SkeletonRow({ i }: { i: number }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "40px 1fr 80px 90px 100px 90px",
      gap: 0,
      padding: "11px 16px",
      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.018)",
      borderBottom: "1px solid var(--c-border-row)",
      alignItems: "center",
    }}>
      <div style={{ height: 12, width: 18, borderRadius: 4, background: "var(--c-border-div)" }} />
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 56, height: 40, borderRadius: 7, background: CAP_SM, flexShrink: 0 }} />
        <div style={{ height: 13, borderRadius: 5, background: "var(--c-border-div)", width: "55%" }} />
      </div>
      <div style={{ height: 22, width: 50, borderRadius: 6, background: "#1e2a22" }} />
      <div style={{ height: 12, width: 60, borderRadius: 4, background: "#181a1a" }} />
      <div style={{ height: 16, width: 72, borderRadius: 5, background: "var(--c-border-div)" }} />
      <div style={{ height: 28, width: 60, borderRadius: 8, background: "#1a1d1a" }} />
    </div>
  );
}

/* ── 정렬/타입 타입 ── */
type SortKey = "cut" | "price-asc" | "regular-desc";
type TypeFilter = "all" | "game" | "dlc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "cut", label: "할인율 높은 순" },
  { key: "price-asc", label: "현재가 낮은 순" },
  { key: "regular-desc", label: "정가 높은 순" },
];

const TYPE_OPTIONS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "game", label: "게임만" },
  { key: "dlc", label: "DLC만" },
];

function SidebarBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block", width: "100%", textAlign: "left",
        padding: "8px 12px", borderRadius: 8, marginBottom: 4,
        fontSize: 13, fontWeight: active ? 700 : 500,
        color: active ? "#5fd39a" : "var(--c-text-sub)",
        background: active ? "rgba(95,211,154,.1)" : "transparent",
        border: active ? "1px solid rgba(95,211,154,.25)" : "1px solid transparent",
        cursor: "pointer",
        fontFamily: "'Noto Sans KR', system-ui, sans-serif",
        transition: "background 0.1s, color 0.1s",
      }}
    >
      {children}
    </button>
  );
}

/* ── 메인 페이지 ── */
export default function DealsPage() {
  const [rawDeals, setRawDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("cut");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(0);

  const resetPage = useCallback(() => setPage(0), []);

  useEffect(() => {
    fetch("/api/deals?limit=100&sort=-cut")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data: unknown = await r.json();
        const asRecord = data as Record<string, unknown>;
        if (asRecord?.error) throw new Error(String(asRecord.error));
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

  /* 클라이언트 필터 + 정렬 */
  const filtered = useMemo(() => rawDeals
    .filter((item) => {
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (typeFilter === "game") return !isDlc(item);
      if (typeFilter === "dlc") return isDlc(item);
      return true;
    })
    .sort((a, b) => {
      if (sortKey === "cut") return b.deal.cut - a.deal.cut;
      if (sortKey === "price-asc") return a.deal.price.amount - b.deal.price.amount;
      if (sortKey === "regular-desc") return b.deal.regular.amount - a.deal.regular.amount;
      return 0;
    }), [rawDeals, searchTerm, typeFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE);

  function handleSearch(v: string) { setSearchTerm(v); resetPage(); }
  function handleSort(k: SortKey) { setSortKey(k); resetPage(); }
  function handleType(k: TypeFilter) { setTypeFilter(k); resetPage(); }

  const SIDEBAR_SECTION_TITLE: CSSProperties = {
    fontSize: 11, fontWeight: 800, color: "var(--c-text-dim)",
    letterSpacing: 0.8, textTransform: "uppercase",
    fontFamily: "'IBM Plex Mono',monospace",
    marginBottom: 8, marginTop: 20,
  };

  return (
    <div>
      <Nav />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 22px 60px" }}>
        <div className="resp-col" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start" }}>

          {/* ── 사이드바 ── */}
          <div className="resp-sticky-off" style={{ position: "sticky", top: 80 }}>
            {/* 검색 */}
            <input
              type="text"
              placeholder="게임 이름 검색…"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: "100%",
                background: "var(--c-bg-deep)",
                border: "1px solid var(--c-border)",
                borderRadius: 9,
                padding: "9px 13px",
                color: "var(--c-text-body2)",
                fontSize: 13,
                fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 4,
              }}
            />

            {/* 정렬 */}
            <div style={SIDEBAR_SECTION_TITLE}>정렬</div>
            {SORT_OPTIONS.map((opt) => (
              <SidebarBtn key={opt.key} active={sortKey === opt.key} onClick={() => handleSort(opt.key)}>
                {opt.label}
              </SidebarBtn>
            ))}

            {/* 타입 */}
            <div style={SIDEBAR_SECTION_TITLE}>타입</div>
            {TYPE_OPTIONS.map((opt) => (
              <SidebarBtn key={opt.key} active={typeFilter === opt.key} onClick={() => handleType(opt.key)}>
                {opt.label}
              </SidebarBtn>
            ))}

            {/* 결과 수 */}
            {!loading && (
              <div style={{ marginTop: 20, fontSize: 12, fontWeight: 600, color: "var(--c-text-muted)" }}>
                총 {filtered.length}개
              </div>
            )}
          </div>

          {/* ── 메인 ── */}
          <div>
            {/* 헤더 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: "var(--c-text-head)", letterSpacing: -0.4, display: "flex", alignItems: "center", gap: 9 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5fd39a" strokeWidth="2">
                  <path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 12 10 12 2z" />
                </svg>
                할인 중인 게임
                {!loading && (
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--c-text-muted)", letterSpacing: 0 }}>
                    ({filtered.length}개)
                  </span>
                )}
              </div>
              {error && (
                <span style={{ fontSize: 12, color: "#e8705f", fontWeight: 600, background: "rgba(232,112,95,.1)", border: "1px solid rgba(232,112,95,.25)", padding: "4px 10px", borderRadius: 7 }}>
                  오류: {error}
                </span>
              )}
            </div>

            {/* 테이블 */}
            <div style={{ background: "var(--c-bg-grad)", border: "1px solid var(--c-border-alt)", borderRadius: 12, overflow: "hidden" }}>
              <DealTableHeader />
              {loading ? (
                Array.from({ length: 12 }, (_, i) => <SkeletonRow key={i} i={i} />)
              ) : error ? (
                <div style={{ padding: "52px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                  <div style={{ fontSize: 14, color: "var(--c-text-muted)" }}>
                    할인 목록을 불러오지 못했습니다
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "52px 0", textAlign: "center", color: "var(--c-text-faint)", fontSize: 14 }}>
                  {searchTerm ? `"${searchTerm}" 검색 결과가 없습니다` : "현재 할인 중인 게임이 없습니다"}
                </div>
              ) : (
                paginated.map((item, i) => (
                  <DealsRow
                    key={item.id}
                    item={item}
                    rank={safePage * ITEMS_PER_PAGE + i + 1}
                    isOdd={i % 2 !== 0}
                  />
                ))
              )}
            </div>

            {/* 페이지네이션 */}
            {!loading && !error && totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20 }}>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  style={{
                    padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                    color: safePage === 0 ? "var(--c-text-dimmer)" : "var(--c-text-body2)",
                    background: "var(--c-bg-panel)", border: "1px solid var(--c-border)",
                    cursor: safePage === 0 ? "not-allowed" : "pointer",
                    fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                  }}
                >
                  이전
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-muted)", fontFamily: "'IBM Plex Mono',monospace" }}>
                  {safePage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                  style={{
                    padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                    color: safePage >= totalPages - 1 ? "var(--c-text-dimmer)" : "var(--c-text-body2)",
                    background: "var(--c-bg-panel)", border: "1px solid var(--c-border)",
                    cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer",
                    fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                  }}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
