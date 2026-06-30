"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

interface SaleEntry {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  startIso: string;
  endIso: string;
  confirmed: boolean;
  desc: string;
  tags: string[];
}

const SALES: SaleEntry[] = [
  { id: "winter-25",    name: "겨울 세일",    icon: "🎄", color: "#60c8e8", bg: "rgba(96,200,232,.08)",   border: "rgba(96,200,232,.25)",   startIso: "2025-12-19T18:00:00Z", endIso: "2026-01-05T18:00:00Z",  confirmed: true,  desc: "연말 최대 세일. 수만 개 타이틀이 역대급 할인을 제공합니다.",                            tags: ["대형세일","역대최저"] },
  { id: "lunar-26",     name: "설날 세일",    icon: "🧧", color: "#e04040", bg: "rgba(224,64,64,.08)",    border: "rgba(224,64,64,.25)",    startIso: "2026-01-30T18:00:00Z", endIso: "2026-02-12T18:00:00Z",  confirmed: false, desc: "음력 설날 세일. 아시아 퍼블리셔 타이틀 위주로 할인이 진행됩니다.",                        tags: [] },
  { id: "spring-26",    name: "봄 세일",      icon: "🌸", color: "#e070a8", bg: "rgba(224,112,168,.08)",  border: "rgba(224,112,168,.25)",  startIso: "2026-03-12T17:00:00Z", endIso: "2026-03-23T17:00:00Z",  confirmed: false, desc: "봄맞이 세일. 인디 및 미드티어 타이틀 중심으로 진행됩니다.",                               tags: [] },
  { id: "summer-26",    name: "여름 세일",    icon: "☀️", color: "#f0a030", bg: "rgba(240,160,48,.1)",    border: "rgba(240,160,48,.3)",    startIso: "2026-06-27T17:00:00Z", endIso: "2026-07-10T17:00:00Z",  confirmed: true,  desc: "Steam 연중 최대 행사. 수천 개 타이틀이 최대 90% 할인 중입니다.",                           tags: ["대형세일","역대최저"] },
  { id: "halloween-26", name: "핼러윈 세일",  icon: "👻", color: "#ff8c00", bg: "rgba(255,140,0,.08)",    border: "rgba(255,140,0,.25)",    startIso: "2026-10-29T17:00:00Z", endIso: "2026-11-02T18:00:00Z",  confirmed: false, desc: "공포·서바이벌 게임 중심의 단기 세일. 짧지만 할인 폭이 큽니다.",                            tags: ["단기세일"] },
  { id: "autumn-26",    name: "가을 세일",    icon: "🍂", color: "#dc8040", bg: "rgba(220,128,64,.08)",   border: "rgba(220,128,64,.25)",   startIso: "2026-11-19T18:00:00Z", endIso: "2026-12-01T18:00:00Z",  confirmed: false, desc: "추수감사절 시즌 대형 세일. 올해 기대작이 처음 큰 폭으로 할인됩니다.",                       tags: ["대형세일"] },
  { id: "winter-26",    name: "겨울 세일",    icon: "🎄", color: "#60c8e8", bg: "rgba(96,200,232,.08)",   border: "rgba(96,200,232,.25)",   startIso: "2026-12-17T18:00:00Z", endIso: "2027-01-05T18:00:00Z",  confirmed: false, desc: "연말 최대 세일. 올해 출시된 인기 타이틀이 역대급 할인을 제공합니다.",                      tags: ["대형세일","역대최저"] },
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}

function getStatus(start: string, end: string): "past" | "current" | "upcoming" {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now > e) return "past";
  if (now >= s) return "current";
  return "upcoming";
}

function fmtCountdown(sec: number): string {
  if (sec <= 0) return "00:00:00";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const z = (v: number) => String(v).padStart(2, "0");
  if (d > 0) return `${d}일 ${z(h)}:${z(m)}:${z(s)}`;
  return `${z(h)}:${z(m)}:${z(s)}`;
}

function StatusBadge({ sale, status, nowMs }: { sale: SaleEntry; status: "past" | "current" | "upcoming"; nowMs: number }) {
  if (status === "past") {
    return (
      <span style={{
        fontSize: 12, fontWeight: 700, color: "var(--c-text-muted)",
        background: "var(--c-border-div)", padding: "3px 10px", borderRadius: 20,
        whiteSpace: "nowrap",
      }}>
        종료됨
      </span>
    );
  }
  if (status === "current") {
    return (
      <span style={{
        fontSize: 12, fontWeight: 700, color: "#06120b",
        background: sale.color, padding: "3px 10px", borderRadius: 20,
        boxShadow: `0 0 8px ${sale.color}`,
        display: "inline-flex", alignItems: "center", gap: 5,
        whiteSpace: "nowrap",
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#06120b", display: "inline-block",
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
        진행 중
      </span>
    );
  }
  const daysUntil = Math.ceil((new Date(sale.startIso).getTime() - nowMs) / 86400000);
  return (
    <span style={{
      fontSize: 12, fontWeight: 700, color: sale.color,
      background: sale.bg, border: `1px solid ${sale.border}`,
      padding: "3px 10px", borderRadius: 20,
      whiteSpace: "nowrap",
    }}>
      D-{daysUntil}
    </span>
  );
}

export default function SalesPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  void tick; // 1초마다 리렌더 트리거
  const nowMs = Date.now();

  const currentSale = SALES.find((s) => getStatus(s.startIso, s.endIso) === "current");
  const upcomingSales = SALES.filter((s) => getStatus(s.startIso, s.endIso) === "upcoming");
  const nextSale: SaleEntry | undefined = upcomingSales[0];

  return (
    <div style={{ minHeight: "100vh" }}>
      <Nav />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 22px 80px" }}>

        {/* 페이지 헤더 */}
        <div style={{ padding: "44px 0 36px", textAlign: "center" }}>
          <h1 style={{
            fontSize: 34, fontWeight: 800, color: "var(--c-text-head)",
            margin: "0 0 12px", letterSpacing: -0.5,
            fontFamily: "'Noto Sans KR', system-ui, sans-serif",
          }}>
            Steam 할인 일정
          </h1>
          <p style={{
            fontSize: 15, color: "var(--c-text-sub)", margin: 0,
            fontFamily: "'Noto Sans KR', system-ui, sans-serif",
          }}>
            역대 최저가를 잡을 최적의 타이밍을 미리 확인하세요
          </p>
        </div>

        {/* 진행 중인 세일 히어로 카드 */}
        {currentSale !== undefined && (() => {
          const endMs = new Date(currentSale.endIso).getTime();
          const remSec = Math.max(0, Math.floor((endMs - nowMs) / 1000));
          return (
            <div style={{
              background: currentSale.bg,
              border: `2px solid ${currentSale.border}`,
              borderRadius: 20,
              padding: "36px 40px",
              marginBottom: 40,
              boxShadow: `0 0 60px ${currentSale.bg}, 0 0 120px rgba(0,0,0,.4)`,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
                <span style={{ fontSize: 60, lineHeight: 1, flexShrink: 0 }}>{currentSale.icon}</span>
                <div style={{ flex: 1, minWidth: 240 }}>
                  {/* 제목 + 확인 배지 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <h2 style={{
                      fontSize: 28, fontWeight: 800, color: currentSale.color,
                      margin: 0, letterSpacing: -0.3,
                      fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                    }}>
                      {currentSale.name}
                    </h2>
                    {currentSale.confirmed && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: currentSale.color,
                        background: "rgba(0,0,0,.3)", border: `1px solid ${currentSale.border}`,
                        padding: "3px 10px", borderRadius: 20,
                      }}>
                        ✓ 확인된 날짜
                      </span>
                    )}
                  </div>

                  {/* 날짜 범위 */}
                  <div style={{ fontSize: 14, color: "var(--c-text-sub)", marginBottom: 18 }}>
                    {fmtDate(currentSale.startIso)} – {fmtDate(currentSale.endIso)}
                  </div>

                  {/* 카운트다운 */}
                  <div style={{
                    fontSize: 24, fontWeight: 800,
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: currentSale.color, marginBottom: 24,
                    letterSpacing: 1,
                  }}>
                    ⏳ {fmtCountdown(remSec)} 남음
                  </div>

                  {/* 버튼 */}
                  <Link
                    href="/"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      fontSize: 14, fontWeight: 700, color: "#06120b",
                      background: currentSale.color,
                      padding: "11px 22px", borderRadius: 10, textDecoration: "none",
                    }}
                  >
                    지금 할인 게임 보기 →
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 다음 예정 세일 배너 (진행 중인 세일 없을 때) */}
        {currentSale === undefined && nextSale !== undefined && (
          <div style={{
            background: nextSale.bg,
            border: `1px solid ${nextSale.border}`,
            borderRadius: 14, padding: "20px 26px",
            marginBottom: 36,
            display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>{nextSale.icon}</span>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{
                fontSize: 16, fontWeight: 800, color: nextSale.color,
                marginBottom: 4, fontFamily: "'Noto Sans KR', system-ui, sans-serif",
              }}>
                다음 세일: {nextSale.name}
              </div>
              <div style={{ fontSize: 13, color: "var(--c-text-sub)" }}>
                {fmtDate(nextSale.startIso)} 시작 예정
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <span style={{
                fontSize: 26, fontWeight: 800, color: nextSale.color,
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                D-{Math.ceil((new Date(nextSale.startIso).getTime() - nowMs) / 86400000)}
              </span>
            </div>
          </div>
        )}

        {/* 2026 세일 일정 그리드 */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{
            fontSize: 22, fontWeight: 800, color: "var(--c-text-head)",
            margin: "0 0 20px", letterSpacing: -0.4,
            fontFamily: "'Noto Sans KR', system-ui, sans-serif",
          }}>
            2026 세일 일정
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}>
            {SALES.map((sale) => {
              const status = getStatus(sale.startIso, sale.endIso);
              const isPast = status === "past";
              const isCurrent = status === "current";

              return (
                <div
                  key={sale.id}
                  style={{
                    background: isCurrent ? sale.bg : "var(--c-bg-panel)",
                    border: `1px solid ${isCurrent ? sale.border : isPast ? "var(--c-border-div)" : "var(--c-border)"}`,
                    borderRadius: 14,
                    padding: "20px 22px",
                    opacity: isPast ? 0.55 : 1,
                    boxShadow: isCurrent ? `0 0 24px ${sale.bg}` : "none",
                    transition: "transform .2s, border-color .2s",
                  }}
                >
                  {/* 카드 헤더 */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{sale.icon}</span>
                      <div>
                        <div style={{
                          fontSize: 15, fontWeight: 800,
                          color: isCurrent ? sale.color : isPast ? "var(--c-text-muted)" : "var(--c-text-head)",
                          marginBottom: 3,
                          fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                        }}>
                          {sale.name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--c-text-muted)" }}>
                          {fmtDate(sale.startIso)} – {fmtDate(sale.endIso)}
                        </div>
                      </div>
                    </div>
                    <StatusBadge sale={sale} status={status} nowMs={nowMs} />
                  </div>

                  {/* 설명 */}
                  <p style={{
                    fontSize: 13, color: isPast ? "var(--c-text-faint)" : "var(--c-text-sub)",
                    lineHeight: 1.65, margin: "0 0 12px",
                    fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                  }}>
                    {sale.desc}
                  </p>

                  {/* 태그 */}
                  {sale.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {sale.tags.map((tag) => (
                        <span key={tag} style={{
                          fontSize: 11, fontWeight: 700, color: sale.color,
                          background: sale.bg, border: `1px solid ${sale.border}`,
                          padding: "2px 8px", borderRadius: 4,
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 확인/추정 */}
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    color: sale.confirmed ? "#5fd39a" : "var(--c-text-muted)",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    {sale.confirmed ? "✓ 확인된 날짜" : "※ 날짜 추정"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 주의 문구 */}
        <div style={{
          padding: "16px 20px",
          background: "rgba(255,180,84,.05)", border: "1px solid rgba(255,180,84,.18)",
          borderRadius: 10, fontSize: 13, color: "var(--c-text-sub)", lineHeight: 1.65,
          fontFamily: "'Noto Sans KR', system-ui, sans-serif",
        }}>
          ⚠️ 예정 날짜는 Steam 과거 세일 패턴 기반 추정입니다. 실제 날짜와 다를 수 있습니다.
        </div>
      </div>
    </div>
  );
}
