"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import PriceChart, { type RawPoint } from "@/components/PriceChart";

const RAW: RawPoint[] = [
  { m: "25.7",  p: 19800, sale: "여름세일", d: 64 },
  { m: "25.8",  p: 55000 },
  { m: "25.9",  p: 38500, sale: "가을한정", d: 30 },
  { m: "25.10", p: 55000 },
  { m: "25.11", p: 55000 },
  { m: "25.12", p: 16500, sale: "겨울세일", d: 70, low: true },
  { m: "26.1",  p: 55000 },
  { m: "26.2",  p: 55000 },
  { m: "26.3",  p: 27500, sale: "봄세일",   d: 50 },
  { m: "26.4",  p: 55000 },
  { m: "26.5",  p: 55000 },
  { m: "26.6",  p: 18150, sale: "여름세일", d: 67, cur: true },
];

const RECS = [
  { name: "추천 게임 A", tag: "액션 · 인디",        disc: 80, now: 9900,  old: 49000 },
  { name: "추천 게임 B", tag: "메트로배니아",         disc: 45, now: 22000, old: 40000 },
  { name: "추천 게임 C", tag: "액션 · 로그라이크",   disc: 67, now: 13200, old: 39900 },
  { name: "추천 게임 D", tag: "인디 · 플랫포머",     disc: 30, now: 31500, old: 45000 },
];

const HERO_BG = "repeating-linear-gradient(45deg,transparent 0 18px,rgba(32,36,34,.5) 18px 36px),linear-gradient(135deg,#1c1f1e,#141716)";
const CAP_BG  = "repeating-linear-gradient(45deg,transparent 0 16px,rgba(32,36,34,.5) 16px 32px),linear-gradient(135deg,#1e211f,#141716)";
const REC_BG  = "repeating-linear-gradient(45deg,transparent 0 14px,rgba(32,36,34,.6) 14px 28px),linear-gradient(135deg,#1c1f1e,#141716)";

function won(n: number) { return "₩" + n.toLocaleString("ko-KR"); }

function fmtCountdown(sec: number): string {
  if (sec <= 0) return "종료";
  let s = sec;
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600);  s -= h * 3600;
  const m = Math.floor(s / 60);    s -= m * 60;
  const z = (v: number) => String(v).padStart(2, "0");
  return `${d}d ${z(h)}:${z(m)}:${z(s)}`;
}

export default function GameDetailPage() {
  const INIT_REMAIN = 1 * 86400 + 14 * 3600 + 22 * 60 + 3;
  const [remain, setRemain] = useState(INIT_REMAIN);
  useEffect(() => {
    const iv = setInterval(() => setRemain((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(iv);
  }, []);

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
          <Link href="/" style={{ color: "#7e827f" }}>홈</Link> › 액션 › 메트로배니아 › <strong style={{ color: "#cfd3d0", fontWeight: 600 }}>게임 타이틀: 부제목</strong>
        </div>

        {/* hero image */}
        <div style={{ height: 300, borderRadius: 14, border: "1px solid #272d2d", background: HERO_BG, display: "flex", alignItems: "flex-end", padding: "22px 26px", position: "relative", overflow: "hidden" }}>
          <span style={{ position: "absolute", top: 14, left: 18, font: "600 11px 'IBM Plex Mono'", color: "#3f5849", letterSpacing: 1 }}>
            HERO ART · 1232×460
          </span>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.6, color: "#f2f8f4", textShadow: "0 2px 18px rgba(0,0,0,.55)", lineHeight: 1.1 }}>
              게임 타이틀: 부제목
            </div>
            <div style={{ fontSize: 14, color: "#abafac", marginTop: 6 }}>개발사 스튜디오 · 2024 · 한국어 지원</div>
          </div>
        </div>

        {/* tags */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 14 }}>
          {["액션", "메트로배니아", "인디"].map((t) => (
            <span key={t} style={{ fontSize: 11.5, fontWeight: 600, color: "#a3a8a4", background: "#1a1d1d", border: "1px solid #272d2d", padding: "4px 10px", borderRadius: 20 }}>{t}</span>
          ))}
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#a3a8a4", background: "#1a1d1d", border: "1px solid #272d2d", padding: "4px 10px", borderRadius: 20 }}>싱글플레이어</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#a3a8a4", background: "#1a1d1d", border: "1px solid #272d2d", padding: "4px 10px", borderRadius: 20 }}>★ 압도적으로 긍정적 (42,118)</span>
        </div>

        {/* main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 22, marginTop: 22, alignItems: "start" }}>

          {/* left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* price chart panel */}
            {panel(
              <PriceChart raw={RAW} historyLow={16500} avg={38000} regular={55000} />
            )}

            {/* stats row */}
            {panel(
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {[
                  { k: "정가",     v: won(55000), g: false, sub: null },
                  { k: "역대 최저", v: won(16500), g: true,  sub: "2025.12 겨울세일", hl: true },
                  { k: "평균가",   v: won(38000), g: false, sub: "최근 12개월" },
                  { k: "현재가",   v: won(18150), g: true,  sub: "역대최저 +10%" },
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
                ))}
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
                  { k: "출시일", v: "2024년 3월 12일" },
                  { k: "개발사 / 배급사", v: "개발사 스튜디오" },
                  { k: "장르", v: "액션 · 메트로배니아 · 인디" },
                  { k: "지원 OS", v: "Windows · macOS · SteamOS" },
                ].map(({ k, v }) => (
                  <div key={k} style={{ background: "#121414", padding: "13px 15px" }}>
                    <div style={{ fontSize: 11, color: "#828783", fontWeight: 600, marginBottom: 6 }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#cfd3d0" }}>{v}</div>
                  </div>
                ))}
                <div style={{ background: "#121414", padding: "13px 15px", gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 11, color: "#828783", fontWeight: 600, marginBottom: 6 }}>한국어 지원</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#5fd39a", background: "rgba(67,194,130,.1)", padding: "3px 8px", borderRadius: 6 }}>✓ 인터페이스</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#5fd39a", background: "rgba(67,194,130,.1)", padding: "3px 8px", borderRadius: 6 }}>✓ 자막</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#7e827f", background: "#1a1d1d", padding: "3px 8px", borderRadius: 6 }}>✕ 음성</span>
                  </div>
                </div>
              </div>
            </>)}

            {/* recommendations panel */}
            {panel(<>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#eef6f0", display: "flex", alignItems: "center", gap: 9 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#828783" strokeWidth="2">
                    <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L4.5 9.7l5.9-.9z" />
                  </svg>
                  비슷한 게임
                </div>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: "#7e827f" }}>장르·태그 기반 추천</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                {RECS.map((r) => (
                  <div key={r.name} className="reccard" style={{ background: "#121414", border: "1px solid #272d2d", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "border-color .15s" }}>
                    <div style={{ height: 84, background: REC_BG, position: "relative" }}>
                      <span style={{ position: "absolute", top: 8, left: 10, font: "600 9px 'IBM Plex Mono'", color: "#3f5849", letterSpacing: 1 }}>CAPSULE</span>
                    </div>
                    <div style={{ padding: "11px 13px" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#cfd3d0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "#828783", marginTop: 2 }}>{r.tag}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600, color: "#06120b", background: "#5fd39a", padding: "2px 6px", borderRadius: 5 }}>-{r.disc}%</span>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, fontWeight: 700, color: "#5fd39a" }}>{won(r.now)}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#7e827f", textDecoration: "line-through" }}>{won(r.old)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>)}
          </div>

          {/* right column — sticky buy panel */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ background: "linear-gradient(180deg,#15241b,#121414)", border: "1px solid #28402f", borderRadius: 14, overflow: "hidden" }}>
              {/* capsule placeholder */}
              <div style={{ height: 140, background: CAP_BG, position: "relative", display: "flex", alignItems: "flex-end", padding: 12 }}>
                <span style={{ position: "absolute", top: 12, left: 14, font: "600 10px 'IBM Plex Mono'", color: "#3f5849", letterSpacing: 1 }}>CAPSULE 616×353</span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  fontSize: 12, fontWeight: 700, color: "#0a120d",
                  background: "#5fd39a", padding: "5px 11px", borderRadius: 7,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a120d" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  지금 사기 좋은 가격
                </span>
              </div>

              <div style={{ padding: 18 }}>
                {/* price row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 20, fontWeight: 600, color: "#0a120d", background: "#5fd39a", padding: "7px 11px", borderRadius: 9, lineHeight: 1 }}>-67%</span>
                  <div>
                    <div style={{ fontSize: 13, color: "#7e827f", textDecoration: "line-through", fontFamily: "'IBM Plex Mono',monospace" }}>₩55,000</div>
                    <div style={{ fontSize: 27, fontWeight: 800, color: "#f2f8f4", letterSpacing: -0.5, fontFamily: "'IBM Plex Mono',monospace" }}>₩18,150</div>
                  </div>
                </div>

                {/* countdown */}
                <div style={{ marginTop: 14, background: "#121414", border: "1px solid #272d2d", borderRadius: 10, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#a3a8a4", fontWeight: 600 }}>⏳ 세일 종료까지</span>
                  <span style={{ fontSize: 17, fontWeight: 700, color: "#ffb454", fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 0.5 }}>
                    {fmtCountdown(remain)}
                  </span>
                </div>

                {/* CTA buttons */}
                <button style={{
                  marginTop: 14, width: "100%", height: 46, border: "none", borderRadius: 11,
                  background: "linear-gradient(135deg,#43c282,#1d7a52)",
                  color: "#06120b", fontSize: 15, fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 6px 20px rgba(67,194,130,.25)",
                  fontFamily: "'Pretendard',system-ui,sans-serif",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06120b" strokeWidth="2.4">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" />
                  </svg>
                  가격 알림 설정
                </button>
                <button style={{
                  marginTop: 9, width: "100%", height: 42,
                  border: "1px solid #2c4135", borderRadius: 11, background: "#171a1a",
                  color: "#cfd3d0", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "'Pretendard',system-ui,sans-serif",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cfd3d0" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  위시리스트에 추가
                </button>

                {/* note */}
                <div style={{ marginTop: 13, fontSize: 11.5, color: "#8b8f8b", textAlign: "center", lineHeight: 1.5 }}>
                  현재가는 <strong style={{ color: "#5fd39a" }}>역대 최저가보다 ₩1,650 높습니다</strong><br />
                  겨울세일(12월)에 더 떨어질 수 있어요
                </div>

                {/* platforms */}
                <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid #222727" }}>
                  {["Windows", "macOS", "SteamOS"].map((p) => (
                    <span key={p} style={{ fontSize: 11, fontWeight: 600, color: "#828783", background: "#121414", border: "1px solid #272d2d", borderRadius: 6, padding: "5px 10px" }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
